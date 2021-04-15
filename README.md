# FydeOS Kiosk Mode Demo App

A demo Chromium OS kiosk application to resemble a minimalistic browser and showcase a designated website.


# To manually enable kiosk mode on Chromium OS for Raspberry Pi builds:

 - Boot Chromium OS for Raspberry Pi till you are landed onto the OOBE screen
 - Invoke "Guest mode" and land onto the desktop in a guest mode session. **Note: Do NOT sign-in with your Google account or kiosk mode would fail**
 - Press `ctrl` + `alt` + `t` to invoke the web-based "crosh" shell prompt, enter `shell` to gain access to a bash shell session
 - enter `sudo su` to gain root privilege
 - enter `mount -o remount rw /` to gain root file system write access
 - modify `/etc/chrome_dev.conf` and add `--force-kiosk-mode` at the end of the file
 - create a file `/etc/init/system-services.override`, edit it and populate this following one line as the content: 
      ```
       start on started boot-services
      ```
 - Create a folder named `kiosk_app` at `/usr/local/share/`; so you will have `/usr/local/share/kiosk_app/`
 - Clone the entire content of this repository to `/usr/local/share/kiosk_app/`, so you would have `/usr/local/share/kiosk_app/kiosk-demo-app`
 - Create `/usr/local/share/kiosk_app/config.json` and populate the following content:
      ```
      {
        "AppId" : "kcdnoglonapgfllkihkgageoililgckl",
        "AppPath" : "kiosk-demo-app",
        "Enable" : true
      }
      ```
 - Reboot your Chromium OS and you should see this FydeOS Kiosk Mode Demo App being launched automatically
