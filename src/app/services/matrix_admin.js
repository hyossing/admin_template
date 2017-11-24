import 'babel-polyfill';
import {ERROR, CONF_ACTION} from './matrix_define'


const MatrixAdmin = (function () {
  const BOOL_DEV_MODE = true;
  const BOOL_MOCK_MODE = true;
  
  const getRequest = function(strUrl){
    if(BOOL_DEV_MODE) console.log("getRequest");
    //if(BOOL_DEV_MODE) console.log("id: " + m_strID + ", pw: " + m_strPW);
    return new Promise(function(resolve, reject){
      //fetch(strUrl, {method:'GET', headers: {Authorization:'Basic ' + btoa(m_strID+':'+m_strPW)}}).then(function(response){
      fetch(strUrl, {method:'GET', credentials: "same-origin"}).then(function(response){
          if(BOOL_DEV_MODE) console.log(response);
          if(response.status === 200){
            if(BOOL_DEV_MODE) console.log("HTTP 200 OK");
            //if(BOOL_DEV_MODE) response.text().then(body => console.log(body));
            //response.text().then(item => resolve(item));
            response.json().then(item => resolve(item));
          }
          else{
            if(BOOL_DEV_MODE) console.error("Not HTTP 200 OK");
            reject(null);
          }
        }, function(error){
          if(BOOL_DEV_MODE) console.error("getRequest error");
          if(BOOL_DEV_MODE) console.error(error);
          reject(null);
        }
      );
    });
  };
  
  const handlePromiseResponse = function(item, resolve, reject){
    // Handle Error
    if(typeof item.error !== 'undefined'){
      if(BOOL_DEV_MODE) console.error(item.error);
      if(item.error.indexOf('400') > -1) {
        reject(ERROR.INVALID_REQ)
      }
      else if(item.error.indexOf('401') > -1) {
        reject(ERROR.UNAUTHORIZED)
      }
      else if(item.error.indexOf('403') > -1) {
        reject(ERROR.FORBIDDEN)
      }
      else if(item.error.indexOf('404') > -1) {
        reject(ERROR.NOT_FOUND)
      }
      else if(item.error.indexOf('406') > -1) {
        reject(ERROR.NO_AVAILABLE)
      }
      else if(item.error.indexOf('501') > -1) {
        reject(ERROR.NOT_IMPLEMENTED)
      }
      else{
        reject(ERROR.NOT_DEFINED)
      }
    }
    else{
      resolve(item);
    }
  };
  
  /*
    * Permanent storage of user information
    * The config contains:
    *    - homeserver url
    *    - Identity server url
    *    - user_id
    *    - access_token
    *    - version: the version of this cache
    */
  let config;
  let configVersion = 0; // Current version of permanent storage
  
  const loadConfig = function() {
    if (!config) {
      config = localStorage.getItem("config");
      if (config) {
        config = JSON.parse(config);
        
        // Reset the cache if the version loaded is not the expected one
        if (configVersion !== config.version) {
          config = undefined;
          //saveConfig();
        }
      }
    }
    return config;
  };
  
  const initFromConfig = function() { // it must be called when app start.
    if (!config) {
      loadConfig();
    }
    if (config) {
      initClient(config.homeserver, config.access_token, config.user_id);
    }
    else {
      console.error("No config to init client");
    }
    
    // convenience to get at user_domain:
    if (config && config.user_id) {
      config.user_domain = config.user_id.replace(/^.*:/, '');
    }
  };
  
  // Indicates if user authentications details are stored in cache
  const isUserLoggedIn = function() {
    // User is considered logged in if his cache is not empty and contains
    // an access token
    if (config && config.access_token) {
      return true;
    }
    else {
      return false;
    }
  };
  
  const storeConfig = function() {
    config.version = configVersion;
    localStorage.setItem("config", JSON.stringify(config));
  };
  
  
  
  
  const CLIENT_PREFIX = '/_matrix/client/api/v1';
  const CLIENT_V2_PREFIX = '/_matrix/client/v2_alpha';
  
  let HEADERS = {
    'User-Agent': 'matrix-js'
  };
  
  let credentials;
  
  const encodeUri = function(pathTemplate, variables) {
    for (var key in variables) {
      if (!variables.hasOwnProperty(key)) { continue; }
      pathTemplate = pathTemplate.replace(
        key, encodeURIComponent(variables[key])
      );
    }
    return pathTemplate;
  };
  
  // avoiding deps on jquery and co
  const encodeParams = function(params) {
    var qs = "";
    for (var key in params) {
      if (!params.hasOwnProperty(key)) { continue; }
      qs += "&" + encodeURIComponent(key) + "=" +
        encodeURIComponent(params[key]);
    }
    return qs.substring(1);
  };
  
  const requestCallback = function(userDefinedCallback) {
    if (!userDefinedCallback) {
      return undefined;
    }
    return function(err, response, body) {
      if (err) {
        return userDefinedCallback(err);
      }
      if (response.statusCode >= 400) {
        return userDefinedCallback(body);
      }
      else {
        userDefinedCallback(null, body);
      }
    };
  };
  
  const isFunction = function (value) {
    return Object.prototype.toString.call(value) === '[object Function]';
  };
  
  const MatrixClient = function (credentials, config) {
    if (typeof credentials === 'string') {
      credentials = {
        'baseUrl': credentials
      };
    }
    const requiredKeys = [
      'baseUrl'
    ];
    for (let i=0; i<requiredKeys.length; i++) {
      if (!credentials.hasOwnProperty(requiredKeys[i])) {
        throw new Error('Missing required key: ' + requiredKeys[i]);
      }
    }
    if (config && config.noUserAgent) {
      HEADERS = undefined;
    }
    this.config = config;
    this.credentials = credentials;
  };
  
  const isLoggedIn = function () {
    return credentials.accessToken != undefined && credentials.userId != undefined;
  };
  
  // Registration/Login operations
  // =============================
  const login = function (loginType, data, callback) {
    data.type = loginType;
    return _doAuthedRequest(
      callback, 'POST', '/login', undefined, data
    );
  };
  
  const register = function (loginType, data, callback) {
    data.type = loginType;
    return this._doAuthedRequest(
      callback, 'POST', '/register', undefined, data
    );
  };
  
  const loginWithPassword = function (user, password, callback) {
    return this.login('m.login.password', {
      user: user,
      password: password
    }, callback);
  };
  
  // Internals
  // =========
  const _doAuthedRequest = function (callback, method, path, params, data) {
    if (!params) {
      params = {};
    }
    params.access_token = this.credentials.accessToken;
    return _doRequest(callback, method, path, params, data);
  };
  
  const _doAuthedV2Request = function (callback, method, path, params, data) {
    if (!params) {
      params = {};
    }
    params.access_token = this.credentials.accessToken;
    return _doV2Request(callback, method, path, params, data);
  };
  
  const _doRequest = function (callback, method, path, params, data) {
    let fullUri = credentials.baseUrl + CLIENT_PREFIX + path;
    if (!params) {
      params = {};
    }
    return _request(callback, method, fullUri, params, data);
  };
  
  const _doV2Request = function (callback, method, path, params, data) {
    let fullUri = credentials.baseUrl + CLIENT_V2_PREFIX + path;
    if (!params) {
      params = {};
    }
    return _request(callback, method, fullUri, params, data);
  };
  
  const _request = function (callback, method, uri, params, data) {
    if (callback !== undefined && !isFunction(callback)) {
      throw Error('Expected callback to be a function');
    }
    return request(
      {
        uri: uri,
        method: method,
        withCredentials: false,
        qs: params,
        body: data,
        json: true,
        headers: HEADERS,
        _matrix_credentials: this.credentials
      },
      requestCallback(callback)
    );
  };
  
  return {
  
  }
}());

export default MatrixAdmin;
