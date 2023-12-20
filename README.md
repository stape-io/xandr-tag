# Xandr tag for Google Tag Manager Server Side

There are two types of events that Xandr tag supports: PageView and Conversion. 

- **PageView event** stores the token URL parameter inside the xandr_token cookie. 
- **Conversion event** sends the HTTP request with the specified conversion data to Xandr.

## How to use the Xandr tag:

1. Create an Xandr pixel and add Page View and Purchase triggers
2. Add the only required field for the conversion event - Pixel ID, other fields are optional.

**Pixel ID** -  advertiser program ID

**Order ID** - booking or transaction ID.

**Total Order Value** - value excluding taxes, delivery, and discounts.

**Other** - You can include an extra field to pass into your pixel and then see this data in conversion reporting.

## Useful link:
- https://stape.io/blog/how-to-set-up-xandr-tag-using-server-google-tag-manager 
## Open Source

Xandr Tag for GTM Server Side is developed and maintained by [Stape Team](https://stape.io/) under the Apache 2.0 license.
