#!/bin/sh

export CS_USER=a
export CS_PASSWORD=a
export CS_BOOKING_EDIT_URL=https://localhost/bookings
export AIRTABLE_BASE_ID="appdpZhhl9ZVvABFf"

mkdir -p caddy_data
mkdir -p caddy_config
podman run -dit -p 3000:3000 --name chopsuey -e CS_USER=$CS_USER -e CS_PASSWORD=$CS_PASSWORD -e CS_BOOKING_EDIT_URL=$CS_BOOKING_EDIT_URL -e AIRTABLE_API_KEY=$AIRTABLE_API_KEY -e AIRTABLE_BASE_ID=$AIRTABLE_BASE_ID -e SLACK_TOKEN=$SLACK_TOKEN gleis21/chopsuey:latest
podman run -dit -p 80:80 -p 443:443 -v $PWD/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data -v caddy_config:/config caddy:2-alpine