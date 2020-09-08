# chopsuey – Gleis 21 Buchungssystem

## Setup 

* Dieses Repository klonen
* Folgendere Environment-Variablen müssen gesetzt sein

| Name | Wert |
| CS_USER | Benutzername zum Anlegen neuer Buchungen durch eine/n Bearbeiter/in |
| CS_PASSWORD | Passwort  zum Anlegen neuer Buchungen durch eine/n Bearbeiter/in |
| CS_BOOKING_EDIT_URL | Basis-URL, unter der der Mieter die Buchungsdaten bearbeiten kann |
| AIRTABLE_API_KEY | API token für die Airtable API |
| AIRTABLE_BASE_ID | ID der Airtable Base |



## Debug-Setup mit Visual Studio Code

`.env` enhält die o.g. environment-Variablen

## Airtable Model

Folgende Airtable Tabellen / Views / Felder werden vom Buchunassystem verwendet und sollten daher nicht umbenannt werden: 

| Table | View | Fields | zugreifendes Service |
| Rechnungen | Grid view, | BuchungKey, Artikel | |
| Rechnungsposten | | |
| Preise | AusstattungPreise | | |
| Buchungen | | |
| Personen | Alle Personen, Bearbeiter EG | Rolle, Email | |
| Artikel | Raeume, Ausstattung |  | |
| Timeslots | Zukunft | BuchungKey, Beginn, Ende, > Raum | |
