#!/bin/sh

export CS_USER=a
export CS_PASSWORD=a
export CS_BOOKING_EDIT_URL=http://localhost/bookings
export AIRTABLE_API_KEY=""
export AIRTABLE_BASE_ID="appdpZhhl9ZVvABFf"
export SLACK_TOKEN=""
node ./bin/cs-web
