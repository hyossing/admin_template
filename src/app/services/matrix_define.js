export const HTTP_ERROR = {
  
  INVALID_REQ : 400,
  UNAUTHORIZED : 401,
  
  FORBIDDEN : 403,
  NOT_FOUND : 404,
  NO_AVAILABLE: 406,
  
  NOT_IMPLEMENTED : 501,
  
  NOT_DEFINED : 10000
};

export const CONF_ACTION = {
  MUTE_ON : 'mute',
  MUTE_OFF : 'unmute',
  DEAF_ON : 'deaf',
  DEAF_OFF : 'undeaf',
  VOLUME_IN : 'volume_in',
  VOLUME_OUT : 'volume_out',
  HUP : 'hup',
  KICK : 'kick',
  LOCK : 'lock',
  UNLOCK : 'unlock'
};
