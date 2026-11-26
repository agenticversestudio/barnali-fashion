# Week-1 demo (Phases 0–3): backend works end-to-end

Prereqs: `npm run dev`, `.env.local` with Turso values, `npm run db:migrate && npm run db:seed -- --demo`.
Automated proof: `npm test` → 108 tests (triggers, auth, roles, pricing, garments, customers, bookings incl. the 10-way race).

```bash
B=http://localhost:3000/api/v1; J='content-type: application/json'
# 1. login as owner (use the admin password given at seed time)
curl -s -c jar -X POST $B/auth/login -H "$J" -d '{"username":"admin","password":"<password>"}'
# 2. search stock
curl -s -b jar "$B/garments?q=red&limit=3"
# 3. live quote for the wizard
curl -s -b jar -X POST $B/bookings/quote -H "$J" -d '{"garmentIds":["LF-001"],"pickupDate":"2026-12-10","returnDueDate":"2026-12-12","transitCharge":200,"advance":2000}'
# 4. book it (customer is created from the phone number)
curl -s -b jar -X POST $B/bookings -H "$J" -d '{"customer":{"name":"Sunita Panda","phone":"9861023451"},"eventName":"Wedding","eventDate":"2026-12-12","pickupDate":"2026-12-10","returnDueDate":"2026-12-12","garmentIds":["LF-001"],"transitCharge":200,"advance":{"amount":2000,"mode":"CASH"}}'
# 5. same garment, overlapping dates -> 409 with the holder's booking id and dates
curl -s -b jar -X POST $B/bookings -H "$J" -d '{"customer":{"name":"Other","phone":"9437188220"},"eventName":"X","eventDate":"2026-12-11","pickupDate":"2026-12-11","returnDueDate":"2026-12-13","garmentIds":["LF-001"],"advance":{"amount":0,"mode":"CASH"}}'
# 6. pickup (collect the rest + deposit), then return with damage; server computes late fee/refund
curl -s -b jar -X POST $B/bookings/<id>/pickup -H "$J" -d '{"payments":[{"kind":"BALANCE","amount":3200,"mode":"UPI"},{"kind":"DEPOSIT","amount":3000,"mode":"CASH"}]}'
curl -s -b jar -X POST $B/bookings/<id>/return -H "$J" -d '{"actualReturnDate":"2026-12-13","damageCharge":500,"cleaningCharge":0,"items":[{"garmentId":"LF-001","nextAction":"AVAILABLE"}],"refund":{"pay":true,"mode":"CASH"}}'
# 7. staff cannot see purchase cost / admin endpoints: log in as a staff user and GET /garments (no purchaseCost), GET /users (403)
```
Note for the demo: dev DB contains seeded mock stock; tests use `ZT*` ids and clean up after themselves.
