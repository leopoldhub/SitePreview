/**
 * @name SitePreview
 * @authorId 262626115741286411
 * @invite Tf52DJh
 * @donate https://www.paypal.com/paypalme/BurnGemios3643
 * @website https://github.com/leopoldhub
 * @source https://github.com/leopoldhub/SitePreview/blob/main/SitePreview.plugin.js
 */

const electron = require('electron');

module.exports = (_ => {
    const config = {
        "info": {
            "name": "SitePreview",
            "author": "BurnGemios3643",
            "version": "1.0.0",
            "description": "add \"show preview\" button on messages with links"
        },
        "changeLog": {
            "improved": {
                "Quick Action": "add \"show preview\" button on messages with links"
            }
        }
    };
    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        getName () {return config.info.name;}
        getAuthor () {return config.info.author;}
        getVersion () {return config.info.version;}
        getDescription () {return config.info.description;}
        
        load() {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue:[]});
            if (!window.BDFDB_Global.downloadModal) {
                window.BDFDB_Global.downloadModal = true;
                BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
                    onConfirm: _ => {
                        delete window.BDFDB_Global.downloadModal;
                        require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
                            if (!e && b && b.indexOf(`* @name BDFDB`) > -1) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => {});
                            else BdApi.alert("Error", "Could not download BDFDB library plugin, try again some time later.");
                        });
                    }
                });
            }
            if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
        }
        start() {this.load();}
        stop() {}
    } : (([Plugin, BDFDB]) => {
        var settings = {};
    
        return class SitePreview extends Plugin {

            onLoad() {
                this.defaults = {
                    settings: {
                        copyOnlySelected:        {value:true,                 description:"Only copy selected text of a message"}
                    }
                };
            }
            
            onStart() {
                this.forceUpdateAll();
            }
            
            onStop() {
                this.forceUpdateAll();
            }

            getSettingsPanel (collapseStates = {}) {
                let settingsPanel, settingsItems = [];
                
                for (let key in settings) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
                    type: "Switch",
                    plugin: this,
                    keys: ["settings", key],
                    label: this.defaults.settings[key].description,
                    value: settings[key]
                }));
                
                return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
            }

            onSettingsClosed () {
                if (this.SettingsUpdated) {
                    delete this.SettingsUpdated;
                    this.forceUpdateAll();
                }
            }
        
            forceUpdateAll () {
                settings = BDFDB.DataUtils.get(this, "settings");
            }

            onMessageContextMenu (e) {
                console.log(e);
                let link = e.instance.props.target.href;
                let id = e.instance.props.message.id;
                if(link && id){
                    let entries = [
                        BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
                            label: "Open preview",
                            id: BDFDB.ContextMenuUtils.createItemId(this.name, "open-preview"),
                            action: _ => {
                                BdApi.showToast("opening preview for \""+link+"\" ...");
                                let msg = document.querySelector('[data-list-item-id="chat-messages___chat-messages-'+id+'"]');
                                if(msg){
                                    let cb = document.getElementById("close-preview");
                                    if(cb){
                                        cb.dispatchEvent(new MouseEvent('click', {
                                            'view': window,
                                            'bubbles': true,
                                            'cancelable': false
                                        }));
                                    }
                                    let win = electron.remote.getCurrentWindow();
                                    let bounds = win.webContents.getOwnerBrowserWindow().getBounds()

                                    let closebtn = document.createElement('button');
                                    closebtn.setAttribute('id', "close-preview");
                                    closebtn.setAttribute('style', "position: absolute; top: 24%; left: 24%; transform: translate(-76%, -76%);");
                                    document.body.append(closebtn);
                                    let closeimg = document.createElement('img');
                                    closeimg.setAttribute('src', "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/OOjs_UI_icon_close-ltr-destructive.svg/768px-OOjs_UI_icon_close-ltr-destructive.svg.png")
                                    closeimg.setAttribute('style', "width: 20px;")
                                    closebtn.append(closeimg);

                                    let view = new electron.remote.BrowserView()
                                    win.addBrowserView(view)
                                    view.setBounds({ x: parseInt(""+(bounds.width/4)), y: parseInt(""+(bounds.height/4)), width: parseInt(""+(bounds.width/2)), height: parseInt(""+(bounds.height/2)) })
                                    view.setAutoResize({
                                        width: true,
                                        height: true,
                                        horizontal: true,
                                        vertical: true
                                    })
                                    view.webContents.loadURL(link)
                                    
                                    closebtn.onclick = function(event) {
                                        closebtn.remove();
                                        if(!view.isDestroyed()){
                                            win.removeBrowserView(view)
                                            view.destroy();
                                        }
                                    }
                                }
                            }
                        })
                    ].filter(n => n);
                    let [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: "devmode-copy-id", group: true});
                    children.splice(index > -1 ? index : children.length, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuGroup, {
                        children: entries
                    }));
                }
            }
        }
    })(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
