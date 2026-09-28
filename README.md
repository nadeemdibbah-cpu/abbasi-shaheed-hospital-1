# Abbasi Shaheed Hospital — Management System

Staff web app for **Abbasi Shaheed Hospital, North Nazimabad, Karachi**.

## Modules

- Patient registration and charts
- OPD appointments
- Consultant roster
- Electronic health records
- Laboratory orders and results
- Pharmacy stock
- Billing in PKR

## Run locally

```bash
cd hms
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Doctor | `doctor` | `doctor123` |
| Reception | `reception` | `rec123` |
| Pharmacy | `pharmacy` | `pharma123` |

Data is stored in `hms/data/db.json` (created on first run from seed data).
