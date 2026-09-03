"""
MobileNetV3 Transfer Learning Training Pipeline for Srinagar Community Waste Classification
Executable on college GPU workstation or local CUDA system.
"""

import os
import argparse
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

CLASSES = [
    'Plastic',
    'Paper/Cardboard',
    'Glass',
    'Metal',
    'Organic/Food Waste',
    'E-Waste',
    'Textile',
    'Hazardous/Special Waste',
    'Residual Waste'
]

def parse_args():
    parser = argparse.ArgumentParser(description="Train MobileNetV3 Waste Classifier")
    parser.add_argument('--data_dir', type=str, default='dataset', help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=15, help='Training epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.0005, help='Learning rate')
    parser.add_argument('--output', type=str, default='models/waste_model.pt', help='Model destination')
    return parser.parse_args()

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform

def train():
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training] Using compute device: {device}")
    
    if not os.path.exists(args.data_dir):
        print(f"[Training] Warning: Dataset directory '{args.data_dir}' not found.")
        print(f"[Training] Please organize waste images into 9 subfolders under '{args.data_dir}':")
        for c in CLASSES:
            print(f"  - {args.data_dir}/{c}/")
        return

    train_trans, val_trans = get_transforms()
    
    # Load dataset
    full_dataset = datasets.ImageFolder(args.data_dir, transform=train_trans)
    train_size = int(0.7 * len(full_dataset))
    val_size = int(0.15 * len(full_dataset))
    test_size = len(full_dataset) - train_size - val_size
    
    train_set, val_set, test_set = torch.utils.data.random_split(
        full_dataset, [train_size, val_size, test_size]
    )
    
    train_loader = DataLoader(train_set, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=args.batch_size, shuffle=False)

    print(f"[Training] Dataset loaded: {train_size} train, {val_size} val, {test_size} test samples.")

    # Initialize MobileNetV3-Small with pre-trained ImageNet weights
    model = models.mobilenet_v3_small(weights='DEFAULT')
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, len(CLASSES))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)

    best_val_acc = 0.0
    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data)
            total += labels.size(0)

        epoch_loss = running_loss / total
        epoch_acc = correct.double() / total

        # Validation phase
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data)
                val_total += labels.size(0)

        val_acc = val_correct.double() / val_total
        print(f"Epoch [{epoch+1}/{args.epochs}] Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} Val Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), args.output)
            print(f"  --> Saved new best model checkpoint to {args.output} (Val Acc: {val_acc:.4f})")

    print(f"\n[Training Completed] Best Validation Accuracy: {best_val_acc:.4f}")

if __name__ == '__main__':
    train()
