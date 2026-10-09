import os
import glob
import time
import json
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms

# 9 Standard Waste Classes defined in EcoCycle Srinagar
WASTE_CLASSES = [
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

class WasteDataset(Dataset):
    def __init__(self, df: pd.DataFrame, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row['filepath']
        label = int(row['label'])
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception:
            # Fallback for rare unreadable image: blank image
            image = Image.new('RGB', (224, 224), color=(128, 128, 128))
        if self.transform:
            image = self.transform(image)
        return image, label


def build_splits(splits_dir=r'c:\wasteman\data\splits_9class', seed=42):
    os.makedirs(splits_dir, exist_ok=True)
    random.seed(seed)

    sources = {
        'Plastic': [
            r'c:\wasteman\data\dataset-resized\plastic',
            r'c:\wasteman\data\garbage_12\garbage_classification\plastic'
        ],
        'Paper/Cardboard': [
            r'c:\wasteman\data\dataset-resized\cardboard',
            r'c:\wasteman\data\dataset-resized\paper',
            r'c:\wasteman\data\garbage_12\garbage_classification\cardboard',
            r'c:\wasteman\data\garbage_12\garbage_classification\paper'
        ],
        'Glass': [
            r'c:\wasteman\data\dataset-resized\glass',
            r'c:\wasteman\data\garbage_12\garbage_classification\brown-glass',
            r'c:\wasteman\data\garbage_12\garbage_classification\green-glass',
            r'c:\wasteman\data\garbage_12\garbage_classification\white-glass'
        ],
        'Metal': [
            r'c:\wasteman\data\dataset-resized\metal',
            r'c:\wasteman\data\garbage_12\garbage_classification\metal'
        ],
        'Organic/Food Waste': [
            r'c:\wasteman\data\garbage_12\garbage_classification\biological'
        ],
        'E-Waste': [
            r'c:\wasteman\data\ewaste'
        ],
        'Textile': [
            r'c:\wasteman\data\garbage_12\garbage_classification\clothes',
            r'c:\wasteman\data\garbage_12\garbage_classification\shoes'
        ],
        'Hazardous/Special Waste': [
            r'c:\wasteman\data\garbage_12\garbage_classification\battery'
        ],
        'Residual Waste': [
            r'c:\wasteman\data\dataset-resized\trash',
            r'c:\wasteman\data\garbage_12\garbage_classification\trash'
        ]
    }

    records = []
    for label_idx, cls_name in enumerate(WASTE_CLASSES):
        src_dirs = sources[cls_name]
        cls_files = []
        for sdir in src_dirs:
            if os.path.exists(sdir):
                for pat in ['*.jpg', '*.jpeg', '*.png']:
                    cls_files.extend(glob.glob(os.path.join(sdir, pat)))
        
        # Deduplicate and sample
        cls_files = sorted(list(set(cls_files)))
        if len(cls_files) > 1200:
            random.shuffle(cls_files)
            cls_files = cls_files[:1200]
            
        print(f"  [{label_idx}] {cls_name:24s}: {len(cls_files)} samples")
        for fp in cls_files:
            records.append({
                'filepath': os.path.abspath(fp),
                'class_name': cls_name,
                'label': label_idx
            })

    full_df = pd.DataFrame(records)
    print(f"\n[Splits] Total samples collected: {len(full_df)}")

    # Stratified 70% train, 15% val, 15% test
    train_df, temp_df = train_test_split(
        full_df, test_size=0.30, random_state=seed, stratify=full_df['label']
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, random_state=seed, stratify=temp_df['label']
    )

    train_df.to_csv(os.path.join(splits_dir, 'train.csv'), index=False)
    val_df.to_csv(os.path.join(splits_dir, 'val.csv'), index=False)
    test_df.to_csv(os.path.join(splits_dir, 'test.csv'), index=False)

    print(f"[Splits] Saved: Train={len(train_df)} ({len(train_df)/len(full_df)*100:.1f}%), "
          f"Val={len(val_df)} ({len(val_df)/len(full_df)*100:.1f}%), "
          f"Test={len(test_df)} ({len(test_df)/len(full_df)*100:.1f}%)")
    return train_df, val_df, test_df


def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.RandomAffine(degrees=0, translate=(0.06, 0.06)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, eval_transform


def train_and_evaluate(
    epochs=10,
    batch_size=32,
    lr=0.0005,
    splits_dir=r'c:\wasteman\data\splits_9class',
    model_output=r'c:\wasteman\ai-service\models\waste_model.pt',
    eval_dir=r'c:\wasteman\ai-service\evaluation'
):
    os.makedirs(os.path.dirname(model_output), exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[Compute Device] {device}")

    # Step 1: Splits
    train_csv = os.path.join(splits_dir, 'train.csv')
    if not os.path.exists(train_csv):
        print("[Dataset] Building 9-class stratified splits...")
        train_df, val_df, test_df = build_splits(splits_dir)
    else:
        train_df = pd.read_csv(train_csv)
        val_df = pd.read_csv(os.path.join(splits_dir, 'val.csv'))
        test_df = pd.read_csv(os.path.join(splits_dir, 'test.csv'))

    train_trans, eval_trans = get_transforms()
    train_loader = DataLoader(WasteDataset(train_df, transform=train_trans), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(WasteDataset(val_df, transform=eval_trans), batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(WasteDataset(test_df, transform=eval_trans), batch_size=batch_size, shuffle=False)

    # Class Weights for balanced cross-entropy loss
    counts = train_df['label'].value_counts().sort_index().values
    total = len(train_df)
    weights = total / (len(WASTE_CLASSES) * counts.astype(np.float32))
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)

    # Step 2: Initialize MobileNetV3-Small with Pretrained ImageNet Weights
    print("[Model] Loading MobileNetV3-Small with ImageNet pretrained weights...")
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, len(WASTE_CLASSES))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=2)

    best_val_acc = 0.0
    best_epoch = 0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}

    print("\n" + "="*70)
    print(f" TRAINING 9-CLASS MOBILENETV3-SMALL ({epochs} EPOCHS)")
    print("="*70)

    start_train_time = time.time()
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        # Train
        model.train()
        running_loss, correct, total_samples = 0.0, 0, 0
        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = outputs.max(1)
            correct += preds.eq(targets).sum().item()
            total_samples += targets.size(0)

        train_loss = running_loss / total_samples
        train_acc = correct / total_samples

        # Validation
        model.eval()
        v_loss, v_correct, v_total = 0.0, 0, 0
        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)
                v_loss += loss.item() * images.size(0)
                _, preds = outputs.max(1)
                v_correct += preds.eq(targets).sum().item()
                v_total += targets.size(0)

        val_loss = v_loss / v_total
        val_acc = v_correct / v_total
        scheduler.step(val_acc)

        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)

        curr_lr = optimizer.param_groups[0]['lr']
        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({time.time()-t0:.1f}s) | "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:5.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:5.2f}% | "
              f"LR: {curr_lr:.6f}", end="")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_epoch = epoch
            # Save state dict directly to match ai-service/src/classifier.py
            torch.save(model.state_dict(), model_output)
            print(" -> [BEST SAVED]")
        else:
            print("")

    print(f"\n[Training Complete in {time.time()-start_train_time:.1f}s] Best Val Acc: {best_val_acc*100:.2f}% (Epoch {best_epoch})")

    # Step 3: Evaluate Best Model on Unseen 15% Holdout Test Set
    print("\n" + "="*70)
    print(" EVALUATING ON INDEPENDENT TEST SET")
    print("="*70)

    model.load_state_dict(torch.load(model_output, map_location=device))
    model.eval()

    all_preds, all_targets, latencies = [], [], []
    with torch.no_grad():
        for images, targets in test_loader:
            images = images.to(device)
            t_infer = time.time()
            outputs = model(images)
            dt = (time.time() - t_infer) / images.size(0) * 1000
            latencies.extend([dt] * images.size(0))

            probs = torch.softmax(outputs, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1)

            all_preds.extend(preds.tolist())
            all_targets.extend(targets.numpy().tolist())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    test_acc = accuracy_score(all_targets, all_preds)
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average='macro', zero_division=0)
    weight_prec, weight_rec, weight_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average='weighted', zero_division=0)

    report_dict = classification_report(all_targets, all_preds, target_names=WASTE_CLASSES, output_dict=True, zero_division=0)
    report_str = classification_report(all_targets, all_preds, target_names=WASTE_CLASSES, digits=4, zero_division=0)

    avg_latency = float(np.mean(latencies))
    model_size_bytes = os.path.getsize(model_output)

    print(f"Test Accuracy:       {test_acc*100:.2f}%")
    print(f"Macro F1-Score:      {macro_f1:.4f}")
    print(f"Weighted F1-Score:   {weight_f1:.4f}")
    print(f"Avg Inference Time:  {avg_latency:.2f} ms")
    print(f"Model File Size:     {model_size_bytes / 1024 / 1024:.2f} MB")
    print("\nPer-Class Classification Report:\n" + report_str)

    # Plot Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds)
    cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(cm_norm, annot=cm, fmt='d', cmap='Blues',
                xticklabels=WASTE_CLASSES, yticklabels=WASTE_CLASSES, ax=ax, cbar=True)
    ax.set_title(f'EcoCycle Srinagar 9-Class MobileNetV3 Confusion Matrix\nAccuracy: {test_acc*100:.2f}%', fontsize=13, fontweight='bold')
    ax.set_xlabel('Predicted Waste Class', fontsize=11, fontweight='bold')
    ax.set_ylabel('True Waste Class', fontsize=11, fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()

    cm_path = os.path.join(eval_dir, 'confusion_matrix_9class.png')
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"[Plot] Confusion matrix saved: {cm_path}")

    # Plot Training Curves
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))
    epochs_range = range(1, len(history['train_loss']) + 1)
    ax1.plot(epochs_range, history['train_loss'], 'b-o', label='Train Loss')
    ax1.plot(epochs_range, history['val_loss'], 'r-s', label='Val Loss')
    ax1.set_title('Training & Validation Loss', fontweight='bold')
    ax1.set_xlabel('Epochs')
    ax1.set_ylabel('Loss')
    ax1.legend()
    ax1.grid(True, linestyle='--', alpha=0.5)

    ax2.plot(epochs_range, [a * 100 for a in history['train_acc']], 'b-o', label='Train Acc (%)')
    ax2.plot(epochs_range, [a * 100 for a in history['val_acc']], 'g-s', label='Val Acc (%)')
    ax2.set_title('Training & Validation Accuracy', fontweight='bold')
    ax2.set_xlabel('Epochs')
    ax2.set_ylabel('Accuracy (%)')
    ax2.legend()
    ax2.grid(True, linestyle='--', alpha=0.5)

    plt.tight_layout()
    curves_path = os.path.join(eval_dir, 'training_curves_9class.png')
    plt.savefig(curves_path, dpi=300)
    plt.close()
    print(f"[Plot] Curves saved: {curves_path}")

    # Per-class summary for metrics.json
    per_class_list = []
    for cls_name in WASTE_CLASSES:
        m = report_dict.get(cls_name, {})
        per_class_list.append({
            'class': cls_name,
            'precision': round(float(m.get('precision', 0)), 4),
            'recall': round(float(m.get('recall', 0)), 4),
            'f1': round(float(m.get('f1-score', 0)), 4),
            'support': int(m.get('support', 0))
        })

    metrics_payload = {
        'status': 'EVALUATION_REPORT',
        'modelName': 'MobileNetV3-Small (Fine-Tuned Transfer Learning)',
        'dataset': 'EcoCycle Srinagar 9-Class Dataset (TrashNet + Garbage-12 + GIZ E-Waste)',
        'isTrained': True,
        'metrics': {
            'accuracy': round(float(test_acc), 4),
            'macroPrecision': round(float(macro_prec), 4),
            'macroRecall': round(float(macro_rec), 4),
            'macroF1Score': round(float(macro_f1), 4),
            'weightedF1Score': round(float(weight_f1), 4),
            'averageInferenceMs': round(avg_latency, 2),
            'modelSizeBytes': model_size_bytes
        },
        'perClassPerformance': per_class_list,
        'confusionMatrix': cm.tolist(),
        'testSampleSize': len(test_df),
        'bestValAccuracy': round(float(best_val_acc), 4),
        'bestEpoch': best_epoch
    }

    metrics_json_path = os.path.join(eval_dir, 'metrics.json')
    with open(metrics_json_path, 'w') as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[Metrics] Saved metrics report to: {metrics_json_path}")


if __name__ == '__main__':
    train_and_evaluate()
