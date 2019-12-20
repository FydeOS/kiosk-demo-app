# FydeOS Kiosk Mode Test App

## Related Chrome flags 

Location:  `/etc/chrome_dev.conf`

```txt
--force-kiosk-mode
```

## Config file

Location: `/usr/local/share/kiosk_app/config.json`

```json
{
  "AppId" : "kcdnoglonapgfllkihkgageoililgckl",
  "AppPath" : "kiosk-demo-app",
  "Enable" : true
}
```
AppId: chrome extension (web app) id \
AppPath: relative path to the path of config file. \
Enable: switch between google demo and fyde demo. 
