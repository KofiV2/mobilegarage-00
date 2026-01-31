# Firestore Backup & Recovery Strategy

## Overview

This document outlines the backup and recovery strategy for the 3ON Mobile Carwash Firestore database.

---

## Backup Methods

### 1. Automated Daily Backups (Recommended)

**Using Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `onae-carwash`
3. Navigate to Firestore Database → Backups
4. Enable automatic backups with daily schedule
5. Set retention period: 30 days minimum

**Benefits:**
- Point-in-time recovery
- Automated scheduling
- Geographic redundancy
- Versioned backups

### 2. Manual Export via gcloud CLI

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project onae-carwash

# Export all collections
gcloud firestore export gs://onae-carwash-backups/$(date +%Y%m%d-%H%M%S) \
  --async

# Export specific collections
gcloud firestore export gs://onae-carwash-backups/$(date +%Y%m%d-%H%M%S) \
  --collection-ids=users,bookings,loyalty \
  --async
```

### 3. Scheduled Exports via Cloud Scheduler

**Setup:**
1. Create Cloud Storage bucket: `onae-carwash-backups`
2. Enable Cloud Scheduler API
3. Create scheduled job:

```bash
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/onae-carwash/databases/(default):exportDocuments" \
  --message-body='{
    "outputUriPrefix": "gs://onae-carwash-backups/'$(date +%Y%m%d)'",
    "collectionIds": ["users", "bookings", "loyalty"]
  }' \
  --oauth-service-account-email=firebase-adminsdk@onae-carwash.iam.gserviceaccount.com \
  --time-zone="Asia/Dubai"
```

---

## Restore Procedures

### Restore from Automated Backup

1. Go to Firebase Console → Firestore Database → Backups
2. Select backup version
3. Click "Restore"
4. Choose destination (new database or overwrite)
5. Confirm restoration

### Restore from gcloud Export

```bash
# List available backups
gsutil ls gs://onae-carwash-backups/

# Import specific backup
gcloud firestore import gs://onae-carwash-backups/20260131-020000 \
  --async

# Import specific collections
gcloud firestore import gs://onae-carwash-backups/20260131-020000 \
  --collection-ids=users,bookings \
  --async
```

---

## Data Collections Priority

### Critical (Backup Every 24 hours)
- **users**: User profiles, auth data
- **bookings**: All booking records
- **loyalty**: Loyalty program data

### Important (Backup Every 7 days)
- **settings**: App configuration
- **analytics**: Usage metrics
- **feedback**: User feedback data

### Low Priority (Backup Monthly)
- **logs**: Application logs
- **temp**: Temporary data

---

## Monitoring & Alerts

### Setup Monitoring

1. **Backup Success Monitoring:**
   ```bash
   # Check last backup status
   gcloud firestore operations list --filter="DONE"
   ```

2. **Cloud Monitoring Alerts:**
   - Alert if backup fails
   - Alert if backup size changes dramatically
   - Alert on database quota usage

3. **Email Notifications:**
   - Daily backup completion report
   - Weekly backup verification report
   - Monthly disaster recovery drill reminder

---

## Security & Access Control

### Backup Storage Permissions

```bash
# Create service account for backups
gcloud iam service-accounts create firestore-backup \
  --display-name="Firestore Backup Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding onae-carwash \
  --member="serviceAccount:firestore-backup@onae-carwash.iam.gserviceaccount.com" \
  --role="roles/datastore.importExportAdmin"

gcloud projects add-iam-policy-binding onae-carwash \
  --member="serviceAccount:firestore-backup@onae-carwash.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Encryption

- Backups are encrypted at rest by default (AES-256)
- Use Customer-Managed Encryption Keys (CMEK) for additional security
- Enable versioning on Cloud Storage bucket

---

## Retention Policy

| Backup Type | Retention Period | Storage Location |
|-------------|------------------|------------------|
| Daily Backups | 30 days | Firebase Automated |
| Weekly Backups | 90 days | Cloud Storage |
| Monthly Backups | 1 year | Cloud Storage (Coldline) |
| Annual Backups | 7 years | Cloud Storage (Archive) |

---

## Disaster Recovery Testing

### Monthly DR Drill

1. Select random backup from previous month
2. Restore to test environment
3. Verify data integrity
4. Test application functionality
5. Document any issues
6. Update procedures as needed

### Recovery Time Objective (RTO)

- **Target RTO**: 4 hours
- **Maximum RTO**: 24 hours

### Recovery Point Objective (RPO)

- **Target RPO**: 24 hours (daily backups)
- **Maximum RPO**: 7 days (weekly backups)

---

## Cost Optimization

### Storage Classes

```bash
# Set lifecycle policy on backup bucket
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 30}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
        "condition": {"age": 90}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
        "condition": {"age": 365}
      },
      {
        "action": {"type": "Delete"},
        "condition": {"age": 2555}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://onae-carwash-backups
```

### Cost Estimation

- **Standard Storage (0-30 days)**: ~$0.02 per GB/month
- **Nearline Storage (30-90 days)**: ~$0.01 per GB/month
- **Coldline Storage (90-365 days)**: ~$0.004 per GB/month
- **Archive Storage (1-7 years)**: ~$0.0012 per GB/month

**Estimated Monthly Cost** (for ~10GB database):
- Daily backups (30 days × 10GB): $6
- Weekly backups (12 weeks × 10GB): $1.20
- Monthly backups (12 months × 10GB): $0.48
- **Total**: ~$7.68/month

---

## Emergency Contacts

### Incident Response Team

| Role | Name | Contact |
|------|------|---------|
| Database Admin | TBD | +971-xxx-xxxx |
| DevOps Lead | TBD | +971-xxx-xxxx |
| Firebase Support | Google | [Firebase Support](https://firebase.google.com/support) |

---

## Quick Reference Commands

```bash
# Check backup status
gcloud firestore operations list

# List all backups
gsutil ls -l gs://onae-carwash-backups/

# Export now
gcloud firestore export gs://onae-carwash-backups/manual-$(date +%Y%m%d-%H%M%S)

# Import backup
gcloud firestore import gs://onae-carwash-backups/[BACKUP_NAME]

# Verify backup integrity
gcloud firestore operations describe [OPERATION_ID]
```

---

## Implementation Checklist

- [ ] Create Cloud Storage bucket `onae-carwash-backups`
- [ ] Enable Firebase automated daily backups
- [ ] Setup Cloud Scheduler for exports
- [ ] Configure lifecycle policies
- [ ] Setup monitoring alerts
- [ ] Create service account with proper permissions
- [ ] Document recovery procedures
- [ ] Test restore process
- [ ] Schedule monthly DR drills
- [ ] Train team on procedures

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-31 | Initial backup strategy | Claude & Team |

---

## References

- [Firestore Backup Documentation](https://firebase.google.com/docs/firestore/backups)
- [gcloud firestore commands](https://cloud.google.com/sdk/gcloud/reference/firestore)
- [Cloud Storage Lifecycle Management](https://cloud.google.com/storage/docs/lifecycle)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
