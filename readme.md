# OCPP Admin Center Application

### Starting project :

```
npm install
```

```
npm run start
```

## Swagger Address:

- http://localhost:3000/api-docs/

### Tariff

#### Tariff conflict validations

1. Helpers (private)
   \_timeRangesOverlap(start1, end1, start2, end2)
   Returns whether two HH:mm ranges overlap (overlap when start1 <= end2 && start2 <= end1).
   \_daysOverlap(day1, day2)
   Returns whether two day selections apply on the same day. undefined/null is treated as “all days”, so it overlaps with any specific day (0–6).
   \_hasOverlappingTimeZones(newEntries, existingEntries)
   For each new time-based entry, checks if any existing entry has the same day and overlapping time range. Returns true if such a conflict exists.
   \_assertNoTariffConflict(chargePointId, connectorId, timeBasedPricing, excludeTariffId?)
   Loads active tariffs for the same chargePointId and connectorId (optionally excluding one by id). If any of them has timeBasedPricing that overlaps (same day + overlapping time) with the given timeBasedPricing, it throws an error.
2. Where validation runs
   createTariff
   Before saving, calls \_assertNoTariffConflict(chargePointId, connectorId, timeBasedPricing). No exclude id.
   updateTariff
   If the update includes or results in timeBasedPricing, calls \_assertNoTariffConflict with the merged timeBasedPricing and excludeTariffId = id so the tariff being updated is not considered a conflict.
   updateConnectorTariff
   Same idea: before applying the update, runs the conflict check on the merged time-based pricing, excluding the current tariff’s id.
3. Conflict rule
   Two time-based entries conflict when:
   Days overlap
   Same dayOfWeek, or at least one has no dayOfWeek (all days).
   Times overlap
   The intervals [startTime, endTime] overlap (HH:mm comparison).
   So you cannot have two active tariffs for the same charge point and connector with overlapping time zones (same day and overlapping start/end time). On conflict, the service throws a clear error so the caller can handle it.
