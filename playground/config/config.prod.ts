export default {
  API: `${location.origin}`,
  sysName: '城市综合管理平台1',
  copyRight: '深圳XXXX网络有限公司1',
  AI_BASE_API: '',
  websocket_url: `wss://${location.host}/iot-api`,
  WS_BASE_API_CALL: `wss://${location.host}/ws`,
  mapConfig: {
    pitch: 60,
    maxPitch: 85,
    center: [114.0825998256405, 22.545241357579343],
    zoom: 16,
    rotation: 0,
    minZoom: 3,
    maxZoom: 21,
    astrictArea: [
      [62.75335, 6.545119],
      [153.120872, 57.227054],
    ],
  },
}
