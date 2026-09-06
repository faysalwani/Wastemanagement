const { Product, Order, User, EcoCreditTransaction, Notification, AuditLog } = require('../models');
const { getIO } = require('../sockets/socketHandler');

// Helper to generate human-readable unique order number
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
};

// @desc    Get active marketplace products (with search, category filter, pagination)
// @route   GET /api/v1/marketplace/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, inStockOnly, page = 1, limit = 20 } = req.query;
    const query = { status: { $ne: 'INACTIVE' } };

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (inStockOnly === 'true') {
      query.stock = { $gt: 0 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ stock: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product details
// @route   GET /api/v1/marketplace/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Product not found.' },
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Create new marketplace product
// @route   POST /api/v1/marketplace/products
// @access  Private (Admin, Super Admin)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      images = [],
      category,
      moneyPrice,
      ecoCreditPrice,
      stock,
      vendor,
    } = req.body;

    if (!name || !description || !category || moneyPrice === undefined || ecoCreditPrice === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide all required product details (name, description, category, prices, stock).' },
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      images: Array.isArray(images) ? images : [images].filter(Boolean),
      category,
      moneyPrice: Math.max(0, parseFloat(moneyPrice)),
      ecoCreditPrice: Math.max(0, parseInt(ecoCreditPrice, 10)),
      stock: Math.max(0, parseInt(stock, 10)),
      vendor: vendor ? vendor.trim() : 'EcoCycle Municipal Cooperative',
      status: parseInt(stock, 10) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    });

    // Audit log
    await AuditLog.create({
      performedBy: req.user.id,
      action: 'PRODUCT_CREATED',
      newValue: product.name,
      reason: `Admin created marketplace product: ${product.name} (Stock: ${product.stock})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update product details and inventory
// @route   PATCH /api/v1/marketplace/products/:id
// @access  Private (Admin, Super Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Product not found.' },
      });
    }

    const {
      name,
      description,
      images,
      category,
      moneyPrice,
      ecoCreditPrice,
      stock,
      status,
      vendor,
    } = req.body;

    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (images) product.images = Array.isArray(images) ? images : [images].filter(Boolean);
    if (category) product.category = category;
    if (moneyPrice !== undefined) product.moneyPrice = Math.max(0, parseFloat(moneyPrice));
    if (ecoCreditPrice !== undefined) product.ecoCreditPrice = Math.max(0, parseInt(ecoCreditPrice, 10));
    if (stock !== undefined) {
      product.stock = Math.max(0, parseInt(stock, 10));
      if (product.stock === 0) product.status = 'OUT_OF_STOCK';
      else if (product.status === 'OUT_OF_STOCK') product.status = 'ACTIVE';
    }
    if (status) product.status = status;
    if (vendor) product.vendor = vendor.trim();

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Deactivate / soft delete product
// @route   DELETE /api/v1/marketplace/products/:id
// @access  Private (Admin, Super Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Product not found.' },
      });
    }

    product.status = 'INACTIVE';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deactivated from marketplace.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: Place an order or redeem using Eco-Credits
// @route   POST /api/v1/marketplace/orders
// @access  Private (Citizen, Admin)
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      productId,
      quantity = 1,
      paymentMethod = 'ECO_CREDITS',
      shippingAddress,
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please select a product to redeem or purchase.' },
      });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.wardName || !shippingAddress.contactPhone) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide complete delivery details (street, ward name, contact phone).' },
      });
    }

    const qty = Math.max(1, parseInt(quantity, 10));

    // 1. Fetch Product and verify active
    const product = await Product.findById(productId);
    if (!product || product.status === 'INACTIVE') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Product is no longer available in the marketplace.' },
      });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: product.stock === 0 ? 'This product is currently out of stock.' : `Only ${product.stock} items remaining in stock.`,
        },
      });
    }

    const totalMoney = paymentMethod === 'MONEY' ? product.moneyPrice * qty : 0;
    const totalEcoCredits = paymentMethod === 'ECO_CREDITS' ? product.ecoCreditPrice * qty : 0;

    // 2. If paying with Eco-Credits, verify citizen's balance
    const user = await User.findById(req.user.id);
    if (paymentMethod === 'ECO_CREDITS') {
      if ((user.ecoCredits || 0) < totalEcoCredits) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: `Insufficient Eco-Credits. You have ${user.ecoCredits || 0} EC, but ${totalEcoCredits} EC is required.`,
          },
        });
      }
    }

    // 3. Atomic stock reduction to prevent race condition / concurrent over-redemption
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Item sold out or stock changed during checkout. Please try again.' },
      });
    }

    // Update status if stock reached 0
    if (updatedProduct.stock === 0 && updatedProduct.status === 'ACTIVE') {
      updatedProduct.status = 'OUT_OF_STOCK';
      await updatedProduct.save();
    }

    const orderNumber = generateOrderNumber();

    // 4. If paying with Eco-Credits, deduct user balance and log immutable ledger transaction
    if (paymentMethod === 'ECO_CREDITS') {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { ecoCredits: -totalEcoCredits } },
        { new: true }
      );

      await EcoCreditTransaction.create({
        userId: req.user.id,
        activityType: 'MARKETPLACE_REDEMPTION',
        creditsEarned: -totalEcoCredits,
        amount: -totalEcoCredits,
        referenceType: 'ORDER',
        referenceId: orderNumber,
        idempotencyKey: `redemption_${orderNumber}_${req.user.id}`,
        balanceAfter: updatedUser.ecoCredits,
        description: `Redeemed ${qty}x ${product.name} in Rewards Marketplace`,
        metadata: {
          productId: product._id,
          productName: product.name,
          quantity: qty,
          orderNumber,
        },
      });
    }

    // 5. Create Order record
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.moneyPrice,
          ecoCreditPrice: product.ecoCreditPrice,
          quantity: qty,
          totalMoney,
          totalEcoCredits,
        },
      ],
      paymentMethod,
      moneyAmount: totalMoney,
      ecoCreditAmount: totalEcoCredits,
      status: 'CONFIRMED',
      shippingAddress: {
        street: shippingAddress.street.trim(),
        wardName: shippingAddress.wardName.trim(),
        city: shippingAddress.city ? shippingAddress.city.trim() : 'Srinagar',
        contactPhone: shippingAddress.contactPhone.trim(),
        notes: shippingAddress.notes ? shippingAddress.notes.trim() : '',
      },
    });

    // 6. Notify Citizen
    await Notification.create({
      userId: req.user.id,
      type: 'MARKETPLACE_ORDER_UPDATED',
      title: 'Order Confirmed!',
      message: `Your order #${orderNumber} for ${qty}x ${product.name} has been placed successfully.`,
      link: '/orders',
      data: { orderId: order._id, orderNumber },
    });

    // 7. Alert municipal admins via socket
    try {
      const io = getIO();
      io.to('admin_room').emit('new_marketplace_order', {
        orderNumber,
        citizenName: user.name,
        productName: product.name,
        paymentMethod,
        amount: paymentMethod === 'ECO_CREDITS' ? `${totalEcoCredits} EC` : `₹${totalMoney}`,
        createdAt: order.createdAt,
      });
    } catch {
      // Socket not ready
    }

    res.status(201).json({
      success: true,
      message: paymentMethod === 'ECO_CREDITS'
        ? `Successfully redeemed ${product.name}! ${totalEcoCredits} Eco-Credits deducted.`
        : `Order placed successfully! Order #${orderNumber}`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen: View own orders and redemptions
// @route   GET /api/v1/marketplace/orders/my
// @access  Private (Citizen, Admin)
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { userId: req.user.id };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.productId', 'images category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order details by ID
// @route   GET /api/v1/marketplace/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'images category description');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Order not found.' },
      });
    }

    // Ownership check
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to view this order.' },
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Citizen / Admin: Cancel order with automatic Eco-Credit refund and inventory restore
// @route   PATCH /api/v1/marketplace/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Order not found.' },
      });
    }

    // Ownership or Admin check
    const isOwner = order.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Unauthorized to cancel this order.' },
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'This order is already cancelled.' },
      });
    }

    if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: `Cannot cancel an order that is already ${order.status.toLowerCase().replace(/_/g, ' ')}.` },
      });
    }

    // 1. Restore product inventory
    for (const item of order.items) {
      const product = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
      if (product && product.status === 'OUT_OF_STOCK' && product.stock > 0) {
        product.status = 'ACTIVE';
        await product.save();
      }
    }

    // 2. If paid with Eco-Credits, create compensating transaction and restore citizen balance
    if (order.paymentMethod === 'ECO_CREDITS' && order.ecoCreditAmount > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        order.userId,
        { $inc: { ecoCredits: order.ecoCreditAmount } },
        { new: true }
      );

      await EcoCreditTransaction.create({
        userId: order.userId,
        activityType: 'REDEMPTION_REFUND',
        creditsEarned: order.ecoCreditAmount,
        amount: order.ecoCreditAmount,
        referenceType: 'ORDER',
        referenceId: order.orderNumber,
        idempotencyKey: `refund_${order.orderNumber}_${Date.now()}`,
        balanceAfter: updatedUser.ecoCredits,
        description: `Refund (+${order.ecoCreditAmount} EC) for cancelled Order #${order.orderNumber}`,
        metadata: {
          orderNumber: order.orderNumber,
          cancelledBy: req.user.id,
        },
      });
    }

    // 3. Mark order CANCELLED
    order.status = 'CANCELLED';
    order.cancellationReason = req.body.reason || (isOwner ? 'Cancelled by citizen' : 'Cancelled by municipal administrator');
    order.refundedAt = new Date();
    await order.save();

    // 4. Notify Citizen
    await Notification.create({
      userId: order.userId,
      type: 'MARKETPLACE_ORDER_UPDATED',
      title: 'Order Cancelled',
      message: order.paymentMethod === 'ECO_CREDITS'
        ? `Order #${order.orderNumber} was cancelled. +${order.ecoCreditAmount} Eco-Credits have been returned to your wallet.`
        : `Order #${order.orderNumber} was cancelled.`,
      link: '/orders',
      data: { orderId: order._id, orderNumber: order.orderNumber },
    });

    res.status(200).json({
      success: true,
      message: order.paymentMethod === 'ECO_CREDITS'
        ? `Order cancelled. ${order.ecoCreditAmount} Eco-Credits refunded to your wallet.`
        : 'Order cancelled successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: List all orders with filters & pagination
// @route   GET /api/v1/marketplace/orders
// @access  Private (Admin, Super Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentMethod, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'ALL') query.status = status;
    if (paymentMethod && paymentMethod !== 'ALL') query.paymentMethod = paymentMethod;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email phone ward')
        .populate('items.productId', 'images category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update order fulfillment status
// @route   PATCH /api/v1/marketplace/orders/:id/status
// @access  Private (Admin, Super Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Order not found.' },
      });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Audit log
    await AuditLog.create({
      performedBy: req.user.id,
      targetUser: order.userId,
      action: 'ORDER_STATUS_UPDATED',
      previousValue: previousStatus,
      newValue: status,
      reason: `Order #${order.orderNumber} updated to ${status}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    // Notify Citizen
    await Notification.create({
      userId: order.userId,
      type: 'MARKETPLACE_ORDER_UPDATED',
      title: `Order Status: ${status.replace(/_/g, ' ')}`,
      message: `Your EcoCycle order #${order.orderNumber} is now ${status.replace(/_/g, ' ')}.`,
      link: '/orders',
      data: { orderId: order._id, orderNumber: order.orderNumber, status },
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
