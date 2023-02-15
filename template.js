const sendHttpRequest = require('sendHttpRequest');
const setCookie = require('setCookie');
const parseUrl = require('parseUrl');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const encodeUriComponent = require('encodeUriComponent');
const getCookieValues = require('getCookieValues');
const getEventData = require('getEventData');
const getAllEventData = require('getAllEventData');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');

const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');
const eventData = getAllEventData();
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
          httpOnly: true,
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
        requestUrl = requestUrl + '&other=' + data.otherParam;
      }

      requestUrl = requestUrl + '&sspdata=' + token;

      if (isLoggingEnabled) {
        logToConsole(
          JSON.stringify({
            Name: 'Xandr',
            Type: 'Request',
            TraceId: traceId,
            EventName: 'Conversion',
            RequestMethod: 'GET',
            RequestUrl: requestUrl,
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
                ResponseBody: body,
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

function enc(data) {
  data = data || '';
  return encodeUriComponent(data);
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
