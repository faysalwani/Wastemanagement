const { User, AuditLog } = require('../models');

/**
 * Idempotent Initial Super Admin & Privileged Role Bootstrap
 * Runs on application startup after database connection is established.
 *
 * 1. Checks if the environment-configured SUPER_ADMIN_EMAIL exists in MongoDB.
 * 2. If it does not exist: Creates the root SUPER_ADMIN account (passwordless, OTP-only).
 * 3. If it already exists (e.g. was previously created as CITIZEN): Reconciles and upgrades
 *    it to SUPER_ADMIN, increments tokenVersion to invalidate stale sessions, and logs an audit trail.
 * 4. Idempotent: Subsequent executions verify the account without modifying existing state.
 */
const bootstrapSuperAdmin = async () => {
  try {
    const rawEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@ecocycle.local';
    const superAdminEmail = rawEmail.toLowerCase().trim();

    const existingUser = await User.findOne({ email: superAdminEmail });

    if (!existingUser) {
      // 1. Account does not exist yet -> Create initial root SUPER_ADMIN
      const newSuperAdmin = await User.create({
        name: process.env.SUPER_ADMIN_NAME || 'Central Super Administrator',
        email: superAdminEmail,
        role: 'SUPER_ADMIN', // Strictly passwordless (OTP Only)
        phone: process.env.SUPER_ADMIN_PHONE || '+91 9419000000',
        wardName: process.env.SUPER_ADMIN_WARD || 'Lal Chowk',
        address: 'SMC Directorate, Srinagar',
        location: { type: 'Point', coordinates: [74.8080, 34.0725] },
        ecoCredits: 1000,
        tier: 'ECO_CHAMPION',
        isActive: true,
        lastOtpVerifiedAt: new Date(),
      });

      // Record in audit log
      await AuditLog.create({
        performedBy: newSuperAdmin._id,
        targetUser: newSuperAdmin._id,
        action: 'ROLE_CHANGE',
        previousValue: 'UNREGISTERED',
        newValue: 'SUPER_ADMIN',
        reason: 'Initial Super Admin account provisioned via environment bootstrap',
        ipAddress: '127.0.0.1',
      });

      console.log(`[Bootstrap] Initial Super Admin account created: ${superAdminEmail} [SUPER_ADMIN]`);
      return newSuperAdmin;
    }

    // 2. Account exists -> Verify role or reconcile if previously registered as CITIZEN / DRIVER
    if (existingUser.role !== 'SUPER_ADMIN') {
      const previousRole = existingUser.role;
      existingUser.role = 'SUPER_ADMIN';
      existingUser.name = process.env.SUPER_ADMIN_NAME || existingUser.name;
      if (process.env.SUPER_ADMIN_PHONE) existingUser.phone = process.env.SUPER_ADMIN_PHONE;
      if (process.env.SUPER_ADMIN_WARD) existingUser.wardName = process.env.SUPER_ADMIN_WARD;
      existingUser.isActive = true;
      // Invalidate any active sessions with stale citizen privileges
      existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;
      await existingUser.save({ validateBeforeSave: false });

      // Record in audit log
      await AuditLog.create({
        performedBy: existingUser._id,
        targetUser: existingUser._id,
        action: 'ROLE_CHANGE',
        previousValue: previousRole,
        newValue: 'SUPER_ADMIN',
        reason: `Automated bootstrap reconciliation: Upgraded from ${previousRole} to SUPER_ADMIN per environment configuration`,
        ipAddress: '127.0.0.1',
      });

      console.log(`[Bootstrap] Reconciled account '${superAdminEmail}': Upgraded from ${previousRole} -> SUPER_ADMIN.`);
      return existingUser;
    }

    // 3. Account already exists with SUPER_ADMIN role
    console.log(`[Bootstrap] Super Admin account verified: ${superAdminEmail} [ACTIVE]`);
    return existingUser;
  } catch (err) {
    console.error(`[Bootstrap Error] Failed to bootstrap Super Admin account:`, err.message);
    throw err;
  }
};

module.exports = { bootstrapSuperAdmin };
