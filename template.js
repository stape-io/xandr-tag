const encodeUriComponent = require('encodeUriComponent');
const getAllEventData = require('getAllEventData');
const getContainerVersion = require('getContainerVersion');
const getCookieValues = require('getCookieValues');
const getEventData = require('getEventData');
const getRequestHeader = require('getRequestHeader');
const getType = require('getType');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const makeString = require('makeString');
const parseUrl = require('parseUrl');
const sendHttpRequest = require('sendHttpRequest');
const setCookie = require('setCookie');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();

if (!isConsentGivenOrNotRequired(data, eventData)) {
  return data.gtmOnSuccess();
}

const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');
const eventName = eventData.event_name;

const PAGE_VIEW_EVENT = data.pageViewEvent || 'page_view';
const PURCHASE_EVENT = data.purchaseEvent || 'purchase';

switch (eventName) {
  case PAGE_VIEW_EVENT:
    const url = getEventData('page_location') || getRequestHeader('referer');

    if (url) {
      const value = parseUrl(url).searchParams.token;

      if (value) {
        const options = {
          domain: 'auto',
          path: '/',
          secure: true,
          httpOnly: true
        };

        if (data.expiration > 0) options['max-age'] = data.expiration;

        setCookie('xandr_token', value, options, false);
      }
    }

    data.gtmOnSuccess();
    break;
  case PURCHASE_EVENT:
    const token = getCookieValues('xandr_token')[0] || '';
    if (token) {
      let requestUrl = 'https://secure.adnxs.com/sspx?id=' + enc(data.pixelId);

      const orderId = data.orderId || eventData.transaction_id || '';

      if (orderId) {
        requestUrl = requestUrl + '&order_id=' + enc(orderId);
      }

      if (data.value) {
        requestUrl = requestUrl + '&value=' + enc(data.value);
      }

      if (data.otherParam) {
        requestUrl = requestUrl + '&other=' + enc(data.otherParam);
      }

      requestUrl = requestUrl + '&sspdata=' + enc(token);

      if (isLoggingEnabled) {
        logToConsole(
          JSON.stringify({
            Name: 'Xandr',
            Type: 'Request',
            TraceId: traceId,
            EventName: 'Conversion',
            RequestMethod: 'GET',
            RequestUrl: requestUrl
          })
        );
      }

      sendHttpRequest(
        requestUrl,
        (statusCode, headers, body) => {
          if (isLoggingEnabled) {
            logToConsole(
              JSON.stringify({
                Name: 'Xandr',
                Type: 'Response',
                TraceId: traceId,
                EventName: 'Conversion',
                ResponseStatusCode: statusCode,
                ResponseHeaders: headers,
                ResponseBody: body
              })
            );
          }

          if (statusCode >= 200 && statusCode < 300) {
            data.gtmOnSuccess();
          } else {
            data.gtmOnFailure();
          }
        },
        { method: 'GET' }
      );
    } else {
      data.gtmOnSuccess();
    }
    break;
  default:
    data.gtmOnSuccess();
    break;
}

/*==============================================================================
  Helpers
==============================================================================*/

function enc(data) {
  if (['null', 'undefined'].indexOf(getType(data)) !== -1) data = '';
  return encodeUriComponent(makeString(data));
}

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}

function determinateIsLoggingEnabled() {
  const containerVersion = getContainerVersion();
  const isDebug = !!(
    containerVersion &&
    (containerVersion.debugMode || containerVersion.previewMode)
  );

  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}
