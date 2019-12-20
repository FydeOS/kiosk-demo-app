//enterprise/deployments/cse/cab_v1/src/js/config.js
// To load a static default config, replace everything after the "=" below with
// your JSON configuration.
var config = null;

//enterprise/deployments/cse/cab_v1/src/js/controllers.js
MODEL({
  name: 'ConfigsController',
  traits: ['ListenToAllTrait'],
  help: 'A controller that acts as a container for our persistence DAO and ' +
      'the current config.',
  issues: [
    'Build the views for storing multiple configs and switching ' +
        'between them',
    'The requires section lists all the views we will eventually ' +
        'use, but this needs to be distributed into models based on ' +
        'hierarchy'
  ],
  requires: [
    'AppConfig',
    'AppDesignerView',
    'BWElementView',
    'ButtonView',
    'DesignerView',
    'EasyDAO',
    'JSONView',
    'KioskView',
    'LightboxView',
    'LocationBarView',
    'PrimitiveView',
    'TermsOfServiceView',
    'URLFilterListView'
  ],

  properties: [
    {
      model_: 'DAOProperty',
      name: 'dao',
      label: 'DAO',
      view: 'DesignerListView',
      subType: 'AppConfig',
      factory: function() {
        return this.EasyDAO.create({
          model: 'AppConfig',
          name: 'appConfigs',
          seqNo: true,
          seqProperty: AppConfig.ID,
          cache: true,
          autoIndex: true,
          daoType: 'ChromeStorageDAO'
        });
      }
    },
    {
      type: 'AppConfig',
      name: 'config',
      label: 'Config',
      view: 'KioskView'
    }
  ],

  listeners: [
    {
      name: 'onDataUpdate',
      help: 'Implementation required bye ListenToAllTrait. Put the latest ' +
          'config to the DAO whenever anything within it changes.',
      code: function() {
        this.dao.put(this.config);
      }
    }
  ],

  methods: [
    {
      name: 'init',
      help: 'If the DAO is empty, initialize it with a default ' +
          'configuration. Also, wire up ListenToAllTrait.',
      code: function() {
        this.SUPER();
        if (config) {
          console.log('dao empty, config present');
          this.config = this.AppConfig.create(config);
          this.dao.put(this.config);
          this.listenToAll(undefined, this.config);
        } else {
          console.log('dao not empty, bootstrap from it');
          this.boostrapFromDAO();
        }
      }
    },
    {
      name: 'boostrapFromDAO',
      code: function() {
        this.dao.select(COUNT())(function(res) {
          if (res.count === 0) {
            this.config = this.AppConfig.create();
            console.log('put default to dao');
            this.dao.put(this.config);
            this.listenToAll(undefined, this.config);
          } else {
            this.dao.limit(1).select(function(cfg) {
              var old = this.config;
              this.config = cfg;
              this.listenToAll(old, this.config);
            }.bind(this));
          }
        }.bind(this));
      }
    }
  ]
});

//enterprise/deployments/cse/cab_v1/src/js/models.js
MODEL({
  name: 'IntIDTrait',
  help: 'Shorthand for adding an integer ID to a model.',

  properties: [
    {
      model_: 'IntProperty',
      name: 'id',
      defaultValue: 0,
      hidden: true
    }
  ]
});

MODEL({
  name: 'Primitive',
  traits: ['IntIDTrait'],
  help: 'Basic wrapper for a primitive that can be stored in DAOs and viewed ' +
      'using array- or DAO-based views',

  properties: [
    {
      name: 'value'
    }
  ]
});

var primitiveArrayViewPropertyProperty = function(prop, view) {
  // foam-framework issue #402 requires this instead of
  // "view: { model_: 'DesignerListView', rowView: 'PrimitiveView' }".
  // This is a known issue in FOAM that should be fixed because the above syntax
  // should do the same thing as what we do below.
  //return view.X.DesignerListView.create(prop).copyFrom({
  return view.X.URLFilterListView.create(prop).copyFrom({
    rowView: 'PrimitiveView'
  });
};

MODEL({
  name: 'Int',
  extendsModel: 'Primitive',
  traits: ['IntIDTrait'],
  help: 'Wrapper for integers. This is exploited by views that expect ' +
      'properties to be modeled objects',

  properties: [
    {
      type: 'Int',
      name: 'value',
      preSet: function(_, newValue) {
        var parsedValue = parseInt(newValue);
        if (parsedValue !== NaN) {
          return parsedValue;
        } else {
          return 0;
        }
      },
      defaultValue: 0
    }
  ]
});


MODEL({
  name: 'String',
  extendsModel: 'Primitive',
  traits: ['IntIDTrait'],
  help: 'Wrapper for strings. This is exploited by views that expect ' +
      'properties to be modeled objects',

  properties: [
    {
      type: 'String',
      name: 'value',
      defaultValue: ''
    }
  ]
});

MODEL({
  name: 'RangeDescriptionTrait',
  help: 'Shorthand for adding a description of a variable range.',
  issues: 'Augment this to support range enforcement, not just description',

  properties: [
    {
      model_: 'StringProperty',
      name: 'rangeDescription',
      help: 'Description of the range of a value'
    }
  ]
});

MODEL({
  name: 'DefaultDescriptionTrait',
  help: 'Shorthand for adding a default description to a property.',

  properties: [
    {
      model_: 'StringProperty',
      name: 'defaultDescription',
      help: 'Description of a default value'
    }
  ]
});

// Construct models: RangeDefaultStringPoperty and RangeDefaultIntProperty with
// associated traits.
['StringPoperty', 'IntProperty'].forEach(function(basePropName) {
  MODEL({
    name: 'RangeDefault' + basePropName,
    extendsModel: basePropName,
    traits: ['RangeDescriptionTrait', 'DefaultDescriptionTrait']
  });
});

MODEL({
  name: 'BasicURLPartMatcher',
  traits: ['IntIDTrait'],
  help: 'Modeled object for the simpler aspects of Chrome events UrlFilters.',

  properties: [
    {
      model_: 'StringProperty',
      name: 'part',
      view: {
        model_: 'ChoiceView',
        choices: [
          ['host', 'Host'],
          ['path', 'Path'],
          ['query', 'Query'],
          ['url', 'URL']
        ]
      },
      defaultValue: 'host'
    },
    {
      model_: 'StringProperty',
      name: 'matchType',
      view: {
        model_: 'ChoiceView',
        choices: [
          ['contains', 'Contains'],
          ['equals', 'Equals'],
          ['prefix', 'Prefix'],
          ['suffix', 'Suffix']
        ]
      },
      defaultValue: 'contains'
    },
    {
      model_: 'StringProperty',
      name: 'value'
    }
  ],

  methods: {
    toURLFilterProperty: function() {
      return {
        name:
            this.part +
            this.matchType[0].toUpperCase() +
            this.matchType.slice(1),
        value: this.value
      };
    }
  }
});

MODEL({
  name: 'AdvancedURLPartMatcher',
  traits: ['IntIDTrait'],
  help: 'Modeled object for the UrlPattern-based aspects of Chrome events ' +
      'UrlFilters.',

  properties: [
    {
      model_: 'StringProperty',
      name: 'part',
      view: {
        model_: 'ChoiceView',
        choices: [
          ['url', 'URL'],
          ['originAndPath', 'Origin and Path']
        ]
      },
      defaultValue: 'url'
    },
    {
      model_: 'StringProperty',
      name: 'value'
    }
  ],

  methods: {
    toURLFilterProperty: function() {
      return {
        name: this.part + 'Matches',
        value: this.value
      };
    }
  }
});

MODEL({
  name: 'URLFilter',
  traits: ['IntIDTrait'],
  help: 'Modeled object for Chrome events UrlFilters.',
  seeAlso: 'https://developer.chrome.com/extensions/events#type-UrlFilter',
  label: 'URL Filter',
  issues: '[name]Values pseudo-properties should generalized as a decorator',

  properties: [
    {
      model_: 'ArrayProperty',
      subType: 'BasicURLPartMatcher',
      name: 'basicMatches',
      view: 'URLFilterListView',
      factory: function() {
        return [];
      }
    },
    {
      model_: 'ArrayProperty',
      subType: 'AdvancedURLPartMatcher',
      name: 'advancedMatches',
      view: 'URLFilterListView',
      factory: function() {
        return [];
      }
    },
    {
      model_: 'ArrayProperty',
      subType: 'String',
      name: 'schemes',
      view: primitiveArrayViewPropertyProperty,
      factory: function() {
        return [];
      }
    },
    {
      name: 'schemeValues',
      getter: function() {
        return this.schemes.map(function(s) {
          return s.value;
        });
      },
      hidden: true
    },
    {
      model_: 'ArrayProperty',
      subType: 'Int',
      name: 'ports',
      view: primitiveArrayViewPropertyProperty,
      factory: function() {
        return [];
      }
    },
    {
      name: 'portValues',
      getter: function() {
        return this.ports.map(function(p) {
          return p.value;
        });
      },
      hidden: true
    }
  ],

  methods: [
    {
      name: 'toRequestMatcher',
      help: 'Construct a Chrome declarative web request RequestMatcher ' +
          'object by mapping over properties of this object.',
      code: function() {
        var urlFilter = {};
        var schemes = this.schemeValues.slice(0);
        var ports = this.portValues.slice(0);
        if (schemes.length > 0) {
          urlFilter.schemes = schemes;
        }
        if (ports.length > 0) {
          urlFilter.ports = ports;
        }

        ['basicMatches', 'advancedMatches'].map( // Extract: [[{name, value}]]
            function(propName) {
              return this[propName].map(function(m) {
                    return m.toURLFilterProperty();
              });
            }.bind(this)
        ).reduce( // Reduce to [{name, value}]
                function(acc, innerArr) {
                  return acc.concat(innerArr);
                }
        ).forEach( // Add [{name, value}] to urlFilter
                    function(nv) {
                      urlFilter[nv.name] = nv.value;
                    }
        );

        console.log('return a new webViewRequest.RequestMatcher');
        console.log('urlFilter: ' + JSON.stringify(urlFilter));
        return new chrome.webViewRequest.RequestMatcher({ url: urlFilter });
      }
    }
  ]
});

MODEL({
  name: 'AppManifest',

  properties: [
    {
      model_: 'StringProperty',
      name: 'name'
    },
    {
      model_: 'StringProperty',
      name: 'version',
      factory: function() {
        return '0.1';
      }
    },
    {
      model_: 'IntProperty',
      name: 'manifest_version',
      factory: function() {
        return 2;
      }
    },
    {
      model_: 'StringProperty',
      name: 'minimum_chrome_version',
      factory: function() {
        return '37.0.0.0';
      }
    },
    {
      model_: 'ArrayProperty',
      name: 'permissions',
      issues: 'This should be modeled, and possibly fetched from the running ' +
          'app manifest.',
      factory: function() {
        return [
          'webview',
          'power',
          'storage',
          'videoCapture',
          'geolocation',
          'pointerLock',
          'system.display',
          {
            'fileSystem': [
              'write', 'retainEntries', 'directory'
            ]
          },
          'accessibilityFeatures.read',
          'accessibilityFeatures.modify'
        ];
      }
    },
    {
      name: 'app',
      issues: [
        'This should be modeled, and possibly fetched from the running ' +
            'app manifest.',
        'Sources should be concatenated and compressed.'
      ],
      factory: function() {
        return {
          'background': {
            'scripts': [
              'js/foam.js',
              'js/cab.js',
              'config.js',
              'background_main.js'
            ]
          }
        };
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'kiosk_enabled',
      factory: function() {
        return true;
      }
    },
    {
      model_: 'StringProperty',
      name: 'default_locale',
      factory: function() {
        return 'en';
      }
    }
  ]
});

MODEL({
  name: 'AppConfig',
  label: chrome.i18n.getMessage('app_config__app_config__label'),
  traits: ['IntIDTrait'],

  requires: [
    'AppManifest',
    'ButtonView',
    'LightboxView',
    'LocationBarView',
    'TermsOfServiceView'
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'appName',
      label: chrome.i18n.getMessage('app_config__app_name__label'),
      help: chrome.i18n.getMessage('app_config__app_name__help'),
      issues: 'Binding to app window title not yet implemented',
      view: {
        model_: 'TextFieldView',
        placeholder:
            chrome.i18n.getMessage('app_config__app_name__placeholder'),
        required: true
      }
    },
    {
      model_: 'StringProperty',
      name: 'version',
      label: chrome.i18n.getMessage('app_config__version__label'),
      help: chrome.i18n.getMessage('app_config__version__help'),
      view: {
        model_: 'TextFieldView',
        placeholder: '0.1',
        required: true
      },
      defaultValue: '0.1'
    },
    {
      model_: 'StringProperty',
      name: 'heading',
      getter: function() {
        if (this.appName) {
          return this.appName;
        } else {
          return 'Config ' + this.id;
        }
      },
      hidden: true
    },
    {
      model_: 'StringProperty',
      name: 'homepage',
      label: chrome.i18n.getMessage('app_config__homepage__label'),
      help: chrome.i18n.getMessage('app_config__homepage__help'),
      view: 'TextFieldView',
      view: {
        model_: 'TextFieldView',
        placeholder: 'http://www.example.com',
        type: 'url',
        required: true
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'enableNavBttns',
      label: chrome.i18n.getMessage('app_config__enable_nav_btns__label'),
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableHomeBttn',
      label: chrome.i18n.getMessage('app_config__enable_home_btn__label'),
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableReloadBttn',
      label: chrome.i18n.getMessage('app_config__enable_reload_btn__label'),
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableLogoutBttn',
      label: chrome.i18n.getMessage('app_config__enable_logout_btn__label'),
      defaultValue: true
    },
    {
      model_: 'BooleanProperty',
      name: 'enableNavBar',
      label: chrome.i18n.getMessage('app_config__enable_navigation_bar__label'),
      hidden: true,  // Taken out from v1.
      defaultValue: false
    },
    {
      model_: 'RangeDefaultIntProperty',
      name: 'sessionDataTimeoutTime',
      label: chrome.i18n.getMessage(
          'app_config__session_data_timeout_time__label'),
      help: chrome.i18n.getMessage(
          'app_config__session_data_timeout_time__help'),
      rangeDescription: '1 - 1440 minutes',
      defaultDescription: '0 = unlimited',
      view: 'RangeDefaultTextFieldView'
    },
    {
      model_: 'RangeDefaultIntProperty',
      name: 'sessionTimeoutTime',
      label: chrome.i18n.getMessage('app_config__session_timeout_time__label'),
      help: chrome.i18n.getMessage('app_config__session_timeout_time__help'),
      rangeDescription: '1 - 1440 minutes',
      defaultDescription: '0 = unlimited',
      view: 'RangeDefaultTextFieldView'
    },
    {
      model_: 'StringProperty',
      name: 'termsOfService',
      label: chrome.i18n.getMessage('app_config__terms_of_service__label'),
      help: chrome.i18n.getMessage('app_config__terms_of_service__help'),
      disabled: true,
      issues: [
        'Support file upload',
        'Implement showing this in lightbox before revealing landing page'
      ],
      view: {
        model_: 'TextAreaView',
        placeholder:
          chrome.i18n.getMessage('app_config__terms_of_service__placeholder')
      }
    },
    {
      model_: 'StringProperty',
      name: 'rotation',
      label: chrome.i18n.getMessage('app_config__rotation__label'),
      help: chrome.i18n.getMessage('app_config__rotation__help'),
      view: {
        model_: 'ChoiceView',
        choices: [
          ['0', '0'],
          ['90', '90'],
          ['180', '180'],
          ['270', '270']
        ]
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'kioskEnabled',
      label: chrome.i18n.getMessage('app_config__kiosk_enabled__label'),
      help: chrome.i18n.getMessage('app_config__kiosk_enabled__help'),
      factory: function() {
        return true;
      },
      issue: 'Consider changing download button title based on this',
      postSet: function(oldValue, newValue) {
        this.setKioskMode(newValue);
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'shouldLoadGlobalConfig',
      help: 'This is a hidden indicator variable that triggers KioskView to ' +
          'look for a different config in a global location.',
      issues: 'This is a hack. We should do something better.',
      hidden: true,
      defaultValue: false
    }
  ],

  methods: {
    setKioskMode: function(enable) {
      // If we are running as exported app, then these won't be available.
      console.log('setKioskMode, enable: ' + enable);
      var elementIDs = ['hack-termsOfService', 'hack-enableLogoutBttn',
                        'hack-rotation'];
      for (var i = 0; i < elementIDs.length; ++i) {
        var el =
            this.X.document.getElementById(elementIDs[i]);
        if (!el) {
          console.log('element with following id not found: ' + elementIDs[i]);
          continue;
        }
        el.style.display = enable ? '' : 'none';
      }
      if (!enable) {
        this.enableLogoutBttn = false;
      }
      // Change download button label.
      var downloadButtonElement =
          this.X.document.getElementById(
              'hack-downloadbutton');
      if (downloadButtonElement) {
        var suffixStr = '';
        if (enable) {
          suffixStr = 'kiosk ';
        }
        downloadButtonElement.innerHTML = 'Export ' + suffixStr +
            'app ' + '&#8681';
      }
    },
    getValueAsTwoDigitString: function(value) {
      // |value| is always within 1..31.
      if (value < 10) {
        // value needs to be prepended with 1 to avoid ChromeOS not
        // recognizing app manifest number.
        return '1' + value;
      } else {
        return '' + value;
      }
    },
    getCurrentDateMonthAsString: function() {
      var currentDate = new Date();
      return this.getValueAsTwoDigitString(currentDate.getMonth() + 1) +
          this.getValueAsTwoDigitString(currentDate.getDate());
    },
    toManifest: function() {
      var foamyManifest = this.AppManifest.create({
        name: this.appName,
        version: this.version,
        kiosk_enabled: this.kioskEnabled
      });
      var manifest = {};
      foamyManifest.model_.properties.forEach(function(prop) {
        if (prop.name !== 'model_') {
          console.log('Manifest property: ', prop.name);
          if (prop.name == 'kiosk_enabled' && !foamyManifest[prop.name]) {
            console.log('kiosk_enabled will be skipped as it is off.');
          } else {
            manifest[prop.name] = foamyManifest[prop.name];
          }
        }
      });
      if (manifest.version[0] == '.') {
        manifest.version = "0" + manifest.version;
      }
      // Random version ID has been disabled.
      //      manifest.version += '.' + this.getCurrentDateMonthAsString() +
      //          '.' + Math.floor(Math.random() * 10000);
      manifest.icons = {'128': 'img/128.png'};
      return manifest;
    }
  }
});

MODEL({
  name: 'Timeout',
  issues: 'We should allow this to bind to a data property for its timeout,' +
      'and also support auto-refresh.',

  properties: [
    {
      model_: 'BooleanProperty',
      name: 'enabled',
      defaultValue: true
    },
    {
      model_: 'IntProperty',
      name: 'seconds',
      defaultValue: 0
    },
    {
      model_: 'IntProperty',
      name: 'milliseconds',
      getter: function() {
        return this.seconds * 1000;
      }
    },
    {
      model_: 'FunctionProperty',
      name: 'callback',
      defaultValue: function() {}
    }
  ],

  listeners: [
    {
      name: 'onTimeout',
      code: function() {
        if (this.enabled) {
          this.callback();
        }
      }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      if (this.milliseconds > 0) {
        window.setTimeout(this.onTimeout, this.milliseconds);
      }
    },
    cancel: function() {
      this.enabled = false;
    }
  }
});

// We include this in models because it is a known dependency of both
// controllers and views. The controller uses it to get deep notifications
// on the config so it can put() the config to the persistent store.
// The KioskView listens for deep notifications on its config to ensure that
// it reflects the latest perspective of the config.
MODEL({
  name: 'ListenToAllTrait',
  help: 'To start listening for updates foo and all (sub-)collections in' +
      'foo,  use this trait, implement an onDataUpdate listener for updates, ' +
      'and invoke this.listenToAll(undefined, foo).',
  issues: 'Currently must use a unified listener for all objects ever passed ' +
      'to this.listenForAll(). It would be nice if a different listener ' +
      'could be injected each time. This would require a store of listener ' +
      'functions so that the right function gets passed to removeListener().',

  methods: {
    listenToAll: function(oldValue, newValue) {
      if (oldValue && oldValue.removeListener) {
        console.log('Listen to all: Removing listener');
        oldValue.removeListener(this.onDataUpdate_);
      }
      if (newValue && newValue.addListener) {
        console.log('Listen to all: Adding listener');
        newValue.addListener(this.onDataUpdate_);
      }
    }
  },

  listeners: [
    {
      name: 'onDataUpdate_',
      code: function(publisher, topic, oldValue, newValue) {
        if (!topic || !topic[1]) {
          return;
        }

        console.log('Listen to all: rebinding data');
        console.log('topic: ' + topic[1]);
        this.onDataUpdate.apply(this, arguments);

        var propertyName = topic[1];
        if (publisher &&
            publisher.model_ &&
            publisher.model_.properties &&
            publisher.model_.properties.filter) {
          var propArr = publisher.model_.properties.filter(function(p) {
            return p.name === propertyName;
          }.bind(this));
          if (!propArr[0]) {
            return;
          }
          var prop = propArr[0];
          if (ArrayProperty.isInstance(prop)) {
            oldValue.forEach(function(arrElem) {
              this.listenToAll(arrElem, undefined);
            }.bind(this));
            newValue.forEach(function(arrElem) {
              this.listenToAll(undefined, arrElem);
            }.bind(this));
          }
        }
      }
    }
  ]
});

//enterprise/deployments/cse/cab_v1/src/js/views.js
MODEL({
  name: 'CSSClassesTrait',
  help: 'Convenience function for concatenating multiple CSS class strings, ' +
      'each of which may contain a series of class names',
  issues: 'Deprecate this and use className and extraClassName built in to ' +
      'views instead.',

  methods: {
    classes: function() {
      var classStr = Array.prototype.slice.call(arguments, 0).reduce(
          function(previousValue, currentValue) {
            if (previousValue) {
              previousValue.push(currentValue);
            }
            return previousValue;
          },
          []
          ).join(' ');
      if (classStr) {
        return 'class="' + classStr + '"';
      } else {
        return '';
      }
    }
  }
});

// Provide placeholders to TextFieldViews and TextAreaViews when
// rangeDescription and/or defualtDescription are provided.
['TextFieldView', 'TextAreaView'].forEach(
    function(designerPlaceholderGetter, baseViewName) {
      MODEL({
        name: 'RangeDefault' + baseViewName,
        extendsModel: baseViewName,

        properties: [
          {
            name: 'rangeDescription'
          },
          {
            name: 'defaultDescription'
          },
          {
            model_: 'StringProperty',
            name: 'placeholder',
            getter: designerPlaceholderGetter
          }
        ]
      });
    }.bind(this, function() {
      var str = '';

      if (this.rangeDescription) {
        str += this.rangeDescription;
        if (this.defaultDescription) {
          str += ' (Default: ' + this.defaultDescription + ')';
        }
      } else if (this.defaultDescription) {
        str += ' Default: ' + this.defaultDescription;
      }
      return str;
    })
);

MODEL({
  name: 'PrimitiveView',
  extendsModel: 'DetailView',
  help: 'Default view for a primitive value wrapped in a FOAM object.',

  templates: [
    function toHTML() {/* $$value */}
  ]
});

MODEL({
  name: 'DesignerListView',
  extendsModel: 'DAOListView',
  help: 'A customized variation of DAOListView that suits our needs for ' +
      'collections within configs.',

  properties: [
    {
      model_: 'BooleanProperty',
      name: 'showActions',
      help: 'Automatically show an action toolbar with buttons for each ' +
          'action.',
      factory: function() {
        return true;
      }
    },
    {
      name: 'rowView',
      help: 'The view to use for elements of this list.',
      defaultValue: 'DesignerView'
    },
    {
      name: 'model',
      help: 'Alias to rowView',
      getter: function() {
        return this.rowView;
      }
    }
  ],

  actions: [
    {
      name: 'add',
      label: '+',
      help: 'Add a new item.',
      description: 'Replace the array with a new array. This is okay because ' +
          'this view is never used with particularly large arrays',
      action: function() {
        var newData = this.data.slice(0) || [];
        var m = FOAM.lookup(this.subType, this.X);
        newData.push(
            m.create({
              id: this.data.length
            })
        );
        this.data = newData;
      }
    }
  ],

  methods: [
    {
      name: 'remove',
      help: 'Helper method for removing element from the array. See remove ' +
          'action in DesignerView for details.',
      code: function(elem) {
        console.log('removing...');
        var newData = this.data.slice(0);
        var idx = -1;
        for (var i = 0; i < newData.length; ++i) {
          if (newData[i] === elem) {
            idx = i;
            break;
          }
        }
        if (idx === -1) {
          return;
        }
        newData.splice(idx, 1);
        this.data = newData;
      }
    }
  ]
});

MODEL({
  name: 'URLFilterListView',
  extendsModel: 'DesignerListView',
  help: 'A customized variation of DesignerListView that suits our needs ' +
      'for URLFilter. REMOVE ME',
  toInnerHTML: function() {
    var ret = '<div style="background-color: red; padding: 10px;">' +
        this.SUPER() + '</div>';
  },
  properties: [
    {
      name: 'rowView',
      help: 'The view to use for elements of this list.',
      defaultValue: 'URLFilterView'
    },
    {
      name: 'model',
      help: 'Alias to rowView',
      getter: function() {
        return this.rowView;
      }
    }
  ],

  templates: [
    {
      name: 'toHTML',
      template: function() {/*
        <div id="%%id" {{{this.cssClassAttr()}}}>{{{this.toInnerHTML()}}}</div>
      */}
    }
  ]
});

MODEL({
  name: 'DesignerView',
  extendsModel: 'DetailView',
  traits: ['CSSClassesTrait'],
  issues: 'Convert HTML-generating methods into templates.',
  requires: [
    'ButtonView'
  ],

  methods: {
    titleHTML: function() {
      var str = '';
      str += '<div ' + this.classes(this.titleContainerClass) + '>';
      ['heading', 'help'].forEach(function(propName) {
        if (this[propName]) {
          str += '<div ' +
              this.classes(propName) + '>' + this[propName] +
              '</div>';
        }
      }.bind(this));
      str += '</div>';
      return str;
    },
    labelHTML: function(model) {
      var str = '';
      ['label', 'help'].forEach(function(propName) {
        if (model[propName]) {
          str += '<div ' +
              this.classes(propName) + '>' + model[propName] +
              '</div>';
        }
      }.bind(this));
      return str;
    },

    toInnerHTML: function() {
      var str = this.titleHTML(this.model);
      for (var i = 0; i < this.model.properties.length; ++i) {
        var prop = this.model.properties[i];

        if (prop.hidden) {
          continue;
        }

        var specialDiv = prop.name == 'termsOfService' ||
                         prop.name == 'enableLogoutBttn' ||
                         prop.name == 'rotation';
        var enabled = !!this.data.kioskEnabled;

        var view = this.createView(prop);
        var rowHTML = this.rowToHTML(null, prop, view);
        if (specialDiv) {
          // Wrap it with a known hacky ID so we can find it later.
          var style = enabled ? '' : ' style="display: none;"';
          str += '<div id="hack-' + prop.name + '" ' + style + '>' +
              rowHTML + '</div>';
        } else {
          str += rowHTML;
        }
        view.data$ = this.data$;
      }

      var showRemoveButton = this.parent.TYPE == 'DesignerListView' ||
          this.parent.TYPE == 'URLFilterListView' ||
          this.parent.TYPE == 'BWListView';
      console.log('showRemoveButton: ' + showRemoveButton);
      if (showRemoveButton) {
        str += this.removeButtonTpl();
      }
      return '<div style="position: relative;">' + str + '</div>';
    }
  },

  templates: [
    {
      name: 'removeButtonTpl',
      template: function() {/*
        <%= this.ButtonView.create({
          label: 'X',
          ariaLabel: chrome.i18n.getMessage('app_config__remove_button__title'),
          action: self.onRemoveKlick,
          className: 'actionButton actionButton-remove available'
        }) %>
      */}
    },
    {
      name: 'rowToHTML',
      issues: 'Named arguments have been (apparently) implemented in FOAM, ' +
          'but do not appear to work here',
      template: function(str, prop, view) {/*
        <div {{{this.classes(this.rowClass, 'detail-' + arguments[1].name)}}}>
          <div {{{this.classes(this.columnClass, 'label')}}}>
            {{{this.labelHTML(arguments[1])}}}
          </div>
          <div {{{this.classes(this.columnClass, this.valueClass)}}}>
            {{{arguments[2]}}}
          </div>
        </div>
      */}
    },
    {
      name: 'toHTML',
      issues: 'This should be unnecessary because it matches a default ' +
          'toHTML implementation. Investigate.',
      template: function() {/*
        <div id="%%id" {{{this.cssClassAttr()}}}>{{{this.toInnerHTML()}}}</div>
      */}
    }
  ],

  listeners: [
    {
      name: 'onRemoveKlick',
      code: function() {
        console.log('onRemoveKlick');
        this.parent.remove(this.data);
      }
    }
  ],

  properties: [
    {
      name: 'tagName',
      defaultValue: 'div'
    },
    {
      model_: 'BooleanProperty',
      name: 'showActions',
      factory: function() {
        return true;
      }
    },
    {
      model_: 'StringProperty',
      name: 'heading',
      defaultValueFn: function() {
        return this.model.label;
      }
    },
    {
      model_: 'StringProperty',
      name: 'help',
      defaultValueFn: function() {
        return this.model.help;
      }
    },
    {
      model_: 'StringProperty',
      name: 'className',
      defaultValue: 'padded flex-container flex-wrap'
    },
    {
      model_: 'StringProperty',
      name: 'rowClass',
      defaultValue: 'paddedOrig flex-container input-row'
    },
    {
      model_: 'StringProperty',
      name: 'columnClass',
      defaultValue: 'padded'
    },
    {
      model_: 'StringProperty',
      name: 'valueClass',
      factory: function() {
        var columnCss = 'column ';
        var parentType = this.parent ? this.parent.TYPE : this.TYPE;
        if (parentType == 'DesignerView') {
          columnCss = '';
        }
        // TODO(lazyboy): These are unused.
        var myClass = ' me-' + this.TYPE;
        var parClass = ' par-' + parentType;
        return myClass + parClass +
               ' flex-container flex-wrap ' + columnCss +
               ' flex-center margin-push-right';
      }
    }
  ]
});

MODEL({
  name: 'BWListView',
  extendsModel: 'DesignerListView',
  properties: [
    {
      name: 'rowView',
      help: 'The view to use for elements of this list.',
      defaultValue: 'BWElementView'
    },
    {
      name: 'model',
      help: 'Alias to rowView',
      getter: function() {
        return this.rowView;
      }
    },
    { // overridden
      model_: 'StringProperty',
      name: 'className',
      defaultValue: 'padded'
    },
    { // overridden
      model_: 'StringProperty',
      name: 'rowClass',
      defaultValue: 'paddedOrig row input-row'
    },
    { // overridden
      model_: 'StringProperty',
      name: 'columnClass',
      defaultValue: 'padded'
    },
    { // overridden
      model_: 'StringProperty',
      name: 'valueClass',
      defaultValue: 'ZZ1'  // Seems unused.
    }
  ]
});

MODEL({
  name: 'BWElementView',
  extendsModel: 'DesignerView',
  traits: ['CSSClassesTrait'],
  issues: 'Convert HTML-generating methods into templates.',

  properties: [
    { // overridden
      model_: 'StringProperty',
      name: 'className',
      defaultValue: 'padded'
    },
    { // overridden
      model_: 'StringProperty',
      name: 'rowClass',
      defaultValue: 'paddedOrig row input-row'
    },
    { // overridden
      model_: 'StringProperty',
      name: 'columnClass',
      defaultValue: 'padded'
    },
    { // overridden
      model_: 'StringProperty',
      name: 'valueClass',
      defaultValue: 'flexRightOnly'  // Importantly used.
    }
  ],

  methods: {
    // green.
    toInnerHTML: function() {
      return '<div style="border: 1px solid #f0f0f0; border-radius: 8px; ' +
          'max-width: 640px; background-color: #fafafa; padding: 10px; ' +
          'margin: 20px 0 10px;">' +
          this.SUPER() +
          '</div>';
    }
  },

  templates: [
    {
      name: 'toHTML',
      issues: 'This should be unnecessary because it matches a default ' +
          'toHTML implementation. Investigate.',
      template: function() {/*
        <div id="%%id" {{{this.cssClassAttr()}}}>{{{this.toInnerHTML()}}}</div>
      */}
    }
  ]
});

MODEL({
  name: 'DesignerTabView',
  extendsModel: 'DesignerView',
  issues: [
    'Currently out of use. Originally designed to show a tabbed view of ' +
        'multiple AppConfigs from the DAO.',
    'Need input element name attribute to be generated and consistent'
  ],

  methods: {
    titleHTML: function() {
      var str = '';
      var inputID = this.nextID();
      str += '<input type="radio" id="' + inputID + '" name="tab-group" />';
      str += '<label for="' + inputID + '">' + this.heading + '</label>';
      return str;
    }
  },

  properties: [
    {
      model_: 'StringProperty',
      name: 'heading',
      getter: function() {
        return this.data.heading;
      }
    },
    {
      model_: 'StringProperty',
      name: 'containerClass',
      defaultValue: 'tab'
    }
  ]
});

MODEL({
  name: 'AppDesignerView',
  extendsModel: 'DetailView',
  traits: ['CSSClassesTrait'],
  requires: [
    'ButtonView'
  ],
  help: 'Top-level view that encompasses kiosk preview and configuration.',
  issues: [
    'Implementation of baseClass and positionClass dynamism in not so "FOAMy"',
    'Actions: Keyboard shortcuts are being applied too liberally; possibly' +
        'across the whole document body.',
    'Spinning refresh button is not currently working.'
  ],

  templates: [
    {
      name: 'toHTML',
      issues: 'ButtonView (or equivalent) for export should be better ' +
          'integrated into view. Even its CSS (see .css file) is a hack.',
      template: function() {/*
          $$config
          <div id="{{{this.id}}}"
               {{{this.classes(this.baseClass, this.positionClass)}}}>
            $$config{ model_: 'DesignerView', model: AppConfig }
            <div class="paddedOrig padded padded-top">
            <%= this.ButtonView.create({
              label: chrome.i18n.getMessage('app_config__export_app__label'),
              title:
                  chrome.i18n.getMessage('app_config__download_button__title'),
              id: 'hack-downloadbutton',
              type: 'submit',
              action: self.onExport,
              className: 'button-export-app available'
            }) %>
            <span class="upload-help-link">
              <a href="https://developer.chrome.com/webstore/publish"
              target="_blank">{{chrome.i18n.getMessage('upload_help_text')}}</a>
            </span>
            </div>
          </div>
      */}
    }
  ],


  listeners: [
    {
      name: 'onExport',
      issues: [
        'We should use FOAMy "USED_MODELS" variable to deduce the ' +
            'files we need, rather than relying on sources.txt.',
        'filesystem.js: We should get a file system DAO for this.',
        'filesystem.js: We need to clear the directory first, then write ' +
            'files.',
        'filesystem.js: We need better error handling here.',
        'filesystem.js: We currently do not provide the user with any ' +
            'feedback when an export completes.'
      ],
      code: function() {
        var config = this.data.config;
        console.log('Export started');
        this.fetchFile('sources.txt', function(_, contents) {
          console.log('Export: sources list fetched');
          var sources =
              contents.split('\n').filter(function(ln) {
                return ln !== '';
              });
          this.fetchFiles(sources, function(sources) {
            console.log('Export: sources fetched');
            sources['config.js'] = 'window.config = ' + config.toJSON() + ';';
            var manifest = config.toManifest();
            console.log('Manifest', manifest);
            sources['manifest.json'] = JSON.stringify(manifest);
            chrome.runtime.sendMessage({
              action: 'export',
              sources: sources
            });
          });
        }.bind(this));
      }
    }
  ],

  methods: [
    {
      name: 'fetchFiles',
      help: 'Fetch multiple files via XHRs and callback when all are complete.',
      code: function(fileNames, callback) {
        var boundTry =
            this.tryToCallback.bind(this, fileNames.length, callback);
        var fetchCallback = (function() {
          var count = 0;
          var accumulator = {};
          return function(fileName, contents) {
            count++;
            accumulator[fileName] = contents;
            return boundTry(count, accumulator);
          }.bind(this);
        }.bind(this))();
        fileNames.forEach(function(fileName) {
          this.fetchFile(fileName, fetchCallback);
        }.bind(this));
      }
    },
    {
      name: 'tryToCallback',
      help: 'Helper for counting callbacks in fetchFiles.',
      code: function(numCallbacks, callback, count, accumulator) {
        if (count >= numCallbacks) {
          return callback.call(this, accumulator);
        } else {
          return false;
        }
      }
    },
    {
      name: 'fetchFile',
      help: 'Fetch a file via XHR and callback.',
      code: function(fileName, callback) {
        (function(fileName, callback, xhr) {
          var isPngFile = fileName.substr(-3).toLowerCase() == 'png';
          xhr.addEventListener(
              'readystatechange',
              function(fileName, callback, xhr, e) {
                if (xhr.readyState == 4) {
                  if (isPngFile) {
                    console.log('use response instead of responseText');
                    var data = Array.apply(null, new Uint8Array(xhr.response));
                    callback(fileName, data);
                  } else {
                    callback(fileName, xhr.responseText);
                  }
                }
              }.bind(this, fileName, callback, xhr)
          );
          xhr.open('GET', fileName, true);
          if (isPngFile) {
            window.console.log('set xhr.responseType to arraybuffer for png');
            xhr.responseType = 'arraybuffer';
          }

          xhr.send();
        }.bind(this, fileName, callback))(new XMLHttpRequest());
      }
    }
  ],

  properties: [
    {
      name: 'baseClass',
      postSet: function(o, n) {
        if (this.$) this.$.className = n + ' ' + this.positionClass;
      },
      // scrolling horizontally shouldn't be needed to disabled via css, it
      // shouldn't just overflow.
      defaultValue: 'trim scroll-y scroll-x-h abs white-bg'
    },
    {
      name: 'positionClass',
      postSet: function(o, n) {
        if (this.$) this.$.className = this.baseClass + ' ' + n;
      },
      defaultValue: 'abs-top-bottom abs-bottom'
    }
  ],

  actions: [
    {
      name: 'moveToTop',
      keyboardShortcuts: ['shift-38' /* up arrow */],
      action: function() {
        console.log('MOVE TO TOP');
        this.positionClass = 'abs-top-bottom abs-top';
      }
    },
    {
      name: 'moveToBottom',
      keyboardShortcuts: ['shift-40' /* down arrow */],
      action: function() {
        console.log('MOVE TO BOTTOM');
        this.positionClass = 'abs-top-bottom abs-bottom';
      }
    },
    {
      name: 'moveToLeft',
      keyboardShortcuts: ['shift-37' /* left arrow */],
      action: function() {
        console.log('MOVE TO LEFT');
        this.positionClass = 'abs-side abs-left';
      }
    },
    {
      name: 'moveToRight',
      keyboardShortcuts: ['shift-39' /* right arrow */],
      action: function() {
        console.log('MOVE TO RIGHT');
        this.positionClass = 'abs-side abs-right';
      }
    },
    {
      name: 'moveToFull',
      keyboardShortcuts: ['shift-187' /* = */],
      action: function() {
        console.log('MOVE TO FULL');
        this.positionClass = 'abs-full';
      }
    },
    {
      name: 'moveToHidden',
      keyboardShortcuts: ['shift-189' /* - */],
      action: function() {
        console.log('MOVE TO HIDE');
        this.positionClass = 'hide';
      }
    }
  ]
});

MODEL({
  name: 'KioskView',
  extendsModel: 'DetailView',
  traits: ['CSSClassesTrait', 'ListenToAllTrait'],
  requires: [
    'AppConfig',
    'ButtonView',
    'JSONView',
    'LightboxView',
    'LocationBarView',
    'TermsOfServiceView',
    'Timeout'
  ],
  help: 'A view of a kiok that receives a kiosk configuration as its data.',
  issues: [
    'Lightbox is currently controlled by this parent view, which is not ideal.',
    'CSS/Layout: It looks like the <webview> is laying out just a little too ' +
        'large. The content is clipped slightly from the botom of the window.',
    'resetTimeouts(): If-guard around timeouts should be unnecessary. ' +
        'Somehow resetTimeouts() is being called before factories run'
  ],

  properties: [
    {
      name: 'data',
      postSet: function(old, v) {
        console.log('********** post set');
        this.listenToAll(old, v);
        this.rebindData();
      }
    },
    {
      model_: 'StringProperty',
      name: 'containerClass',
      defaultValue: 'full trim flex-container column'
    },
    {
      model_: 'StringProperty',
      name: 'contentClass',
      defaultValue: 'trim flex full rel'
    },
    {
      model_: 'StringProperty',
      name: 'webviewHelpClass',
      defaultValue: 'cab-welcome-container'
    },
    {
      model_: 'StringProperty',
      name: 'webviewClass',
      defaultValue: 'trim full'
    },
    {
      name: 'webview',
      getter: function() {
        return $(this.id + '-webview');
      }
    },
    {
      type: 'LightboxView',
      name: 'lightbox'
    },
    {
      type: 'TermsOfServiceView',
      name: 'tosView'
    },
    {
      type: 'BooleanProperty',
      hidden: true,
      name: 'showingTerms',
      defaultValue: false
    },
    {
      name: 'webViewRequest',
      defaultValue: chrome.webViewRequest
    },
    {
      model_: 'IntProperty',
      name: 'displayTime',
      help: 'Display settings notion of time; used to avoid unnecessary ' +
          'rotation reloads',
      defaultValue: 0
    },
    {
      model_: 'IntProperty',
      name: 'listTime',
      help: 'Blacklist/whitelist notion of time; used to avoid unnecessary ' +
          'list reloads',
      defaultValue: 0
    },
    {
      type: 'Timeout',
      name: 'sessionTimeout',
      issues: 'We should use the lightbox to display a warning/countdown.',
      factory: function() {
        return this.Timeout.create();
      }
    },
    {
      type: 'Timeout',
      name: 'sessionDataTimeout',
      factory: function() {
        return this.Timeout.create();
      }
    }
  ],

  actions: [
    {
      name: 'showConfig',
      help: 'Need to manually invoke lightbox toggling because it may be ' +
          'invisible (unable to get focus)',
      keyboardShortcuts: ['shift-192' /* tilda */],
      action: function() {
        this.lightbox.toggle();
        this.lightbox.subViews = [
          this.JSONView.create({
            title: 'JSON Config',
            data: this.data,
            caption: 'Copy the above code into the "config" variable in ' +
                'config.js in your app directory'
          }),
          this.JSONView.create({
            title: 'manifest.json',
            data: this.data.toManifest(),
            caption: 'Copy the above into manifest.json in your app directory'
          })
        ];
      }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      if (this.data && this.data.shouldLoadGlobalConfig && config) {
        console.log('Loading global config');
        this.data = this.AppConfig.create(config);
        if (this.data.kioskEnabled && this.data.termsOfService) {
          console.log('Show terms of service view instead');
          this.showingTerms = true;
        }
      }
    },
    initHTML: function() {
      this.SUPER();
      this.rebindData();

      if (this.data.kioskEnabled && this.showingTerms) {
        this.tosView.toggle();
      }
    },
    initInnerHTML: function() {
      this.SUPER();
      this.webview.addEventListener('loadcommit', function() {
        this.resetTimeouts();
      }.bind(this));
      this.webview.addEventListener('permissionrequest', function(e) {
        // TODO(ebeach): Show permission to user.
        if (e.permission === 'media' ||
            e.permission === 'geolocation' ||
            e.permission === 'pointerLock') {
          e.request.allow();
        }
      });
    },
    rebindData: function() {
      this.updateHTML();
      console.log('on rebindData, kioskEnabled: ' +
          this.data.kioskEnabled);

      this.rotateView();
      this.rebuildBWLists();
      console.log('navigate to: ' + this.data.homepage);
      this.navigateTo(this.data.homepage);
      this.resetTimeouts();
    },
    rotateView: function() {
      if (chrome && chrome.system && chrome.system.display &&
          chrome.system.display) {
        this.displayTime++;
        chrome.system.display.getInfo(function(cfg, myTime, displays) {
          if (this.displayTime !== myTime) {
            return;
          }

          var displaysAlreadyAligned = true;
          var parsedRotation = parseInt(cfg.rotation);
          var cfgRotation = !isNaN(parsedRotation) ? parsedRotation : 0;
          displays.forEach(function(cfgRotation, display) {
            if (display.rotation !== cfgRotation)
              displaysAlreadyAligned = false;
          }.bind(this, cfgRotation));
          if (!displaysAlreadyAligned) {
            displays.forEach(function(cfgRotation, display) {
              chrome.system.display.setDisplayProperties(
                  display.id,
                  { rotation: cfgRotation },
                  function() {
                    if (chrome.runtime.lastError) {
                      console.log('Set rotation failed: ' +
                          chrome.runtime.lastError.message);
                    } else {
                      console.log('Set rotation succeeded');
                    }
                  }
              );
            }.bind(this, cfgRotation));
          }
        }.bind(this, this.data, this.displayTime));
      }
    },
    rebuildBWLists: function() {
      if (!this.webview) {
        console.log('rebuildBWLists: MISSING WEBVIEW');
        return;
      }
      this.listTime++;
      this.webview.request.onRequest.removeRules(
          undefined,
          function(cfg, myTime) {
            if (this.listTime !== myTime ||
                (!cfg.enableWhitelist && cfg.enableBlacklist)) {
              return;
            }

            var webViewRequest = this.webViewRequest;
            var rules = [];
            if (cfg.enableWhitelist) {
              console.log('WHITELIST ENABLED');
              rules.push({ // Block everything by default
                priority: 100,
                conditions: [
                  new webViewRequest.RequestMatcher(
                      { url: { urlContains: '' } }
                  )
                ],
                actions: [new webViewRequest.CancelRequest()]
              });
              var whitelistConditions =
                  cfg.whitelist.map(
                  function(urlFilter) { return urlFilter.toRequestMatcher(); }
                  );
              if (whitelistConditions.length > 0) {
                rules.push({ // Ignore blocking when whitelist condition is met
                  priority: 200,
                  conditions: whitelistConditions,
                  actions: [new webViewRequest.IgnoreRules({
                    lowerPriorityThan: 200
                  })]
                });
              }
            }
            if (cfg.enableBlacklist) {
              console.log('BLACKLIST ENABLED');
              var blacklistConditions =
                  cfg.blacklist.map(
                  function(urlFilter) {
                    return urlFilter.toRequestMatcher();
                  }
                  );
              if (blacklistConditions.length > 0) {
                rules.push({ // Block everything on the blacklist
                  priority: 300,
                  conditions: blacklistConditions,
                  actions: [new webViewRequest.CancelRequest()]
                });
              }
            }
            if (rules.length > 0) {
              this.webview.request.onRequest.addRules(
                  rules,
                  function() { console.log('RULES ADDED'); }
              );
            } else {
              console.log('NO RULES TO ADD');
            }
          }.bind(this, this.data, this.listTime)
      );
    },
    navigateTo: function(url) {
      if (!this.webview) {
        console.log('navigateTo: MISSING WEBVIEW');
        return;
      }
      this.webview.src = url;
    },
    resetTimeouts: function() {
      console.log('Resetting timeouts');
      if (this.sessionTimeout) {
        this.sessionTimeout.cancel();
      }
      // TODO(markditmer): Should this be if (this.sessionDataTimeout)
      if (this.sessionTimeout) {
        this.sessionDataTimeout.cancel();
      }
      if (this.data.sessionTimeoutTime > 0) {
        this.sessionTimeout = this.Timeout.create({
          seconds: this.data.sessionTimeoutTime * 60,
          callback: this.onSessionEnded
        });
      }
      if (this.data.sessionDataTimeoutTime > 0) {
        this.sessionDataTimeout = this.Timeout.create({
          seconds: this.data.sessionDataTimeoutTime * 60,
          callback: this.onClearSessionData
        });
      }
    },
    shouldHideControls: function() {
      var data = this.data;
      return (!data ||
          !(data.enableNavBttns || data.enableHomeBttn ||
          data.enableReloadBttn || data.enableLogoutBttn));
    }
  },

  listeners: [
    {
      name: 'onBack',
      code: function() {
        this.webview.back();
      }
    },
    { name: 'onForward',
      code: function() {
        this.webview.forward();
      }
    },
    {
      name: 'onHome',
      code: function() {
        console.log('navigate to: ' + this.data.homepage);
        this.webview.src = this.data.homepage;
      }
    },
    {
      name: 'onReload',
      code: function() {
        this.webview.reload();
      }
    },
    {
      name: 'onLogout',
      code: function() {
        console.log('* onLogout clicked *');
        this.onClearSessionData();
        this.onSessionEnded();
      }
    },
    {
      name: 'onBindBttn',
      issues: 'It appears that when buttons are added/removed, all buttons ' +
          '(past and present) get rebound. This is not right!',
      code: function(listener) {
        this.webview.addEventListener('loadstop', listener);
      }
    },
    {
      name: 'onBindAddr',
      issues: 'Ditto to onBindBttn todo',
      code: function(listener) {
        this.webview.addEventListener('loadcommit', function(e) {
          if (e.isTopLevel) {
            listener.apply(this, arguments);
          }
        });
      }
    },
    {
      name: 'onDataUpdate',
      help: 'Rebind data from config to webview whenever there is any change ' +
          'made to the config',
      code: function() {
        this.rebindData();
      }
    },
    {
      name: 'onSessionEnded',
      code: function() {
        console.log('Session ended; going home');
        console.log('Resetting session end timeout');
        this.sessionEndedTimeout = this.Timeout.create({
          seconds: this.data.maxUserSessionMinutes * 60,
          callback: this.onSessionEnded
        });
        this.navigateTo(this.data.homepage);
      }
    },
    {
      name: 'onClearSessionData',
      code: function() {
        console.log('Session data timed out; clearing data');
        this.webview.clearData(
            {},
            {'appcache': true, 'cookies': true},
            function() {
              console.log('Resetting session data timeout');
              this.sessionEndedTimeout = this.Timeout.create({
                seconds: this.data.maxUserSessionMinutes * 60,
                callback: this.onSessionEnded
              });
            }.bind(this)
        );
      }
    }
  ],

  templates: [
    {
      name: 'toHTML',
      template: function() {/*
        <div id="{{{this.id}}}" {{{this.classes(this.containerClass)}}}>
         {{{this.toInnerHTML()}}}
        </div>
        <% this.lightbox = this.LightboxView.create(); %>
        <%= this.lightbox %>
        <% this.tosView = this.TermsOfServiceView.create({data: this.data}); %>
        <%= this.tosView %>
      */}
    },
    {
      name: 'toInnerHTML',
      issues: 'These inlined ButtonViews are kind of like actions, but they ' +
          'do not live in this.data, and the action attributes ' +
          '(e.g. isEnabled)  are updated dynamically, which is not well ' +
          'supported.',

      template: function() {/*
        <div id="{{{this.id}}}-controls"
            class="controls {{{this.shouldHideControls() ? 'hide' : ''}}}">

          <div id="{{{this.id}}}-browser-controls" class="browser-controls">

            <%= this.ButtonView.create({
                  label: '&#9664;',
                  ariaLabel:
                      chrome.i18n.getMessage('app_config__back_button__title'),
                  className: 'back',
                  visible: this.data.enableNavBttns,
                  enabled: false,
                  action: this.onBack,
                  bindState: this.onBindBttn,
                  updateState: function(e) {
                    this.enabled = self.webview.canGoBack();
                  }
                }),
                this.ButtonView.create({
                  label: '&#9654;',
                  ariaLabel: chrome.i18n.getMessage(
                      'app_config__forward_button__title'),
                  className: 'forward',
                  visible: this.data.enableNavBttns,
                  enabled: false,
                  action: this.onForward,
                  bindState: this.onBindBttn,
                  updateState: function(e) {
                    this.enabled = self.webview.canGoForward();
                  }
                }),
                this.ButtonView.create({
                  label: '&#8962;',
                  ariaLabel:
                      chrome.i18n.getMessage('app_config__home_button__title'),
                  className: 'home',
                  visible: this.data.enableHomeBttn,
                  action: this.onHome
                }),
                this.ButtonView.create({
                  label: '&#10227;',
                  ariaLabel: chrome.i18n.getMessage(
                      'app_config__reload_button__title'),
                  className: 'reload',
                  visible: this.data.enableReloadBttn,
                  action: this.onReload
                }),
                this.ButtonView.create({
                  label: chrome.i18n.getMessage(
                      'app_config__logout_button__title'),
                  ariaLabel: chrome.i18n.getMessage(
                      'app_config__logout_button__title'),
                  className: 'logout',
                  visible: this.data.enableLogoutBttn,
                  action: this.onLogout
                }),
                this.LocationBarView.create({
                  visible: this.data.enableNavBar,
                  bindState: this.onBindAddr,
                  updateState: function(e) {
                    // TODO: If can go away once unhooking of old views/elements
                    //  works properly.
                    if (this.text) this.text.value = e.url;
                  }
                }) %>
          </div>

        </div>

        <div {{{this.classes(this.contentClass)}}}>
          <div id="<%= this.setClass('unAvailable', function() {
                 return this.data && this.data.homepage !== undefined &&
                   this.data.homepage.length > 0;
               }.bind(this), this.id + 'id-webview-help-text') %>"
               {{{this.classes(this.webviewHelpClass)}}}>
            <h3><%= chrome.i18n.getMessage('app_welcome_title') %></h3>
            <p><%= chrome.i18n.getMessage('app_welcome_text_pt1') %></p>
            <p><%= chrome.i18n.getMessage('app_welcome_text_pt2') %></p>
            <p><%= chrome.i18n.getMessage('app_welcome_text_pt3') %>
            <a target="_blank"
              href="https://support.google.com/chrome/a/answer/6137027">
            <%= chrome.i18n.getMessage('app_welcome_text_pt4') %></a></p>
          </div>
          <webview id="{{{this.id}}}-webview"
                   {{{this.classes(this.webviewClass)}}}>
          </webview>
        </div>
    */}
    }
  ]
});

MODEL({
  name: 'ViewVisibilityTrait',

  properties: [
    {
      model_: 'BooleanProperty',
      name: 'visible',
      defaultValue: true
    }
  ]
});

MODEL({
  name: 'ViewEnableabilityTrait',

  properties: [
    {
      model_: 'BooleanProperty',
      name: 'enabled',
      defaultValue: true,
      postSet: function(_, newEnabled) {
        if (this.$) {
          this.$.disabled = !newEnabled;
        }
      }
    }
  ]
});

MODEL({
  name: 'TermsOfServiceView',
  extendsModel: 'View',
  requires: [
    'ButtonView'
  ],
  issues: [
    'Unify this with LightboxView'
  ],
  properties: [
    {
      name: 'data'
    },
    {
      name: 'title',
      defaultValue: 'Terms of Service'
    },
    {
      model_: 'BooleanProperty',
      name: 'visible',
      issues: [
        'This way of doing dynamism is not very FOAMy.',
        'These class names should not be hard-coded.'
      ],
      postSet: function(oldValue, newValue) {
        if (oldValue === newValue) {
          return;
        }
        var overlay = $(this.id + '-tos-overlay');
        var tosView = $(this.id + '-tos');
        if (!overlay || !tosView) {
          return;
        }
        if (newValue) {
          overlay.className =
              'full trim abs abs-full tos-overlay';
          tosView.className =
              'full trim abs abs-full flex-container column center';
        } else {
          overlay.className =
              'full trim abs abs-full tos-overlay hide';
          tosView.className =
              'full trim abs abs-full flex-container column center hide';
        }
      },
      defaultValue: false
    }
  ],

  templates: [
    {
      name: 'toHTML',
      template: function() {/* {{{this.toInnerHTML()}}} */}
    },
    {
      name: 'toInnerHTML',
      issues: 'CSS class names should be configurable, not hard-coded.',
      template: function() {/*
        <div id="{{{this.id}}}-tos-overlay"
             class="full trim abs abs-full lightbox-overlay
                    {{{this.visible ? '' : 'hide'}}}">
        </div>
        <div id="{{{this.id}}}-tos"
             class="full trim abs abs-full flex-container column center
                    {{{this.visible ? '' : 'hide'}}}">
          <div class="flex-grow flex-shrink flex-container row center">
            <div id="{{{this.id}}}"
                 class="flex-grow flex-shrink flex-container column center tos">
              <div>
                <h1>{{{this.title}}}</h1>
              </div>
              <div class="tos-contents">
                <% if (this.data && this.data.termsOfService) { %>
                  {{{this.data.termsOfService}}}
                <% } else { %>
                  Could not find termsOfService field.
                <% } %>
              </div>
              <div>
                <span>
                  <%= this.ButtonView.create({
                    label: 'I agree',
                    title: 'I agree',
                    action: this.onAgree.bind(this),
                    className: 'actionButton actionButton available'
                  }) %>
                </span>
              </div>
            </div>
          </div>
        </div>
      */}
    }
  ],

  actions: [
    {
      name: 'toggle',
      action: function() {
        console.log('Terms of service view toggle');
        this.visible = !this.visible;
      }
    },
    {
      name: 'onAgree',
      action: function() {
        console.log('onAgree click');
        this.toggle();
      }
    }
  ]
});

MODEL({
  name: 'LightboxView',
  extendsModel: 'View',

  issues: [
    'Abstract out the styling of this view.',
    'Provide a better interface for this view.'
  ],

  properties: [
    {
      model_: 'ArrayProperty',
      subType: 'JSONView',
      name: 'subViews',
      factory: function() { return []; },
      postSet: function(oldView, newView) {
        this.updateHTML();
      },
      issues: [
        'List of objects should be used instead of list of views directly.'
      ]
    },
    {
      model_: 'BooleanProperty',
      name: 'visible',
      issues: [
        'This way of doing dynamism is not very FOAMy.',
        'These class names should not be hard-coded.'
      ],
      postSet: function(oldValue, newValue) {
        if (oldValue === newValue) {
          return;
        }
        var overlay = $(this.id + '-lightbox-overlay');
        var lightbox = $(this.id + '-lightbox');
        if (!overlay || !lightbox) {
          return;
        }
        if (newValue) {
          overlay.className =
              'full trim abs abs-full lightbox-overlay';
          lightbox.className =
              'full trim abs abs-full flex-container column center';
        } else {
          overlay.className =
              'full trim abs abs-full lightbox-overlay hide';
          lightbox.className =
              'full trim abs abs-full flex-container column center hide';
        }
      },
      defaultValue: false
    }
  ],

  templates: [
    {
      name: 'toHTML',
      template: function() {/* {{{this.toInnerHTML()}}} */}
    },
    {
      name: 'toInnerHTML',
      issues: 'CSS class names should be configurable, not hard-coded.',
      template: function() {/*
        <div id="{{{this.id}}}-lightbox-overlay"
             class="full trim abs abs-full lightbox-overlay
                    {{{this.visible ? '' : 'hide'}}}">
        </div>
        <div id="{{{this.id}}}-lightbox"
             class="full trim abs abs-full flex-container column center
                    {{{this.visible ? '' : 'hide'}}}">
          <div class="flex-grow flex-shrink flex-container row center">
            <div id="{{{this.id}}}"
                 class="flex-grow flex-shrink flex-container column center
                        lightbox">
              {{{this.subViews}}}
            </div>
          </div>
        </div>
      */}
    }
  ],

  actions: [
    {
      name: 'toggle',
      action: function() {
        console.log('Lightbox toggle');
        this.visible = !this.visible;
      }
    }
  ]
});

MODEL({
  name: 'JSONView',
  extendsModel: 'View',
  help: 'View of JSON code with header and caption. JSON text is selectable.',

  properties: [
    {
      model_: 'StringProperty',
      name: 'tagName',
      defaultValue: 'div'
    },
    {
      model_: 'StringProperty',
      name: 'title',
      defaultValue: 'JSON'
    },
    {
      name: 'data'
    },
    {
      model_: 'StringProperty',
      name: 'caption',
      defaultValue: 'For more information, visit ' +
          '<a href="http://json.org/">json.org</a>'
    }
  ],

  // markditmer: This is a hack.
  methods: {
    toString: function() {
      return this.toHTML();
    }
  },

  templates: [
    {
      name: 'toHTML',
      issues: 'Style should be modeled in a CSS class, not inlined.',
      template: function() {/*
        <div>
          <h1>{{{this.title}}}</h1>
        </div>
        <div>
          <pre style="-webkit-user-select: text;">
            <% if (this.data && this.data.toJSON) { %>
              {{{this.data.toJSON()}}}
            <% } else { %>
              {{{JSONUtil.stringify(this.data)}}}
            <% } %>
          </pre>
        </div>
        <div class="caption"><p>{{{this.caption}}}</p></div>
      */}
    }
  ]
});

MODEL({
  name: 'StateBinderTrait',
  help: 'Trait for classes that can provide a listener that rebinds their ' +
      'state. This is used, for example, for buttons that rebind state based ' +
      'on <webview> events when the <webview> belongs to a different view.',

  properties: [
    {
      model_: 'FunctionProperty',
      name: 'bindState',
      defaultValue: function() {}
    },
    {
      model_: 'FunctionProperty',
      name: 'updateState',
      defaultValue: function() {}
    }
  ],

  methods: {
    initHTML: function() {
      this.SUPER();
      this.bindState(this.updateState.bind(this));
    }
  }
});

MODEL({
  name: 'ButtonView',
  extendsModel: 'DetailView',
  traits: [
    'CSSClassesTrait',
    'ViewVisibilityTrait',
    'ViewEnableabilityTrait',
    'StateBinderTrait'
  ],
  issues: [
    'We mirror model properties. There must be a simpler way of doing this ' +
        'in FOAM.'
  ],

  properties: [
    {
      name: 'action',
      help: 'Function or name of method on this.data to invoke when the ' +
          'button is clicked.',
      defaultValue: 'action'
    },
    {
      model_: 'StringProperty',
      name: 'label'
    },
    {
      model_: 'StringProperty',
      name: 'title'
    },
    {
      model_: 'StringProperty',
      name: 'ariaLabel',
      defaultValue: ''
    },
    {
      model_: 'StringProperty',
      name: 'type',
      defaultValue: 'button'
    }
  ],

  templates: [
    function toHTML() {/* {{{this.toInnerHTML()}}} */},
    {
      name: 'toInnerHTML',
      help: 'Use this.visible to decide whether or not to render this button.',
      template: function() {/*
        <% if (this.visible) { %>
          <button type="{{{this.type}}}"
                  id="{{{this.id}}}"
                  {{{this.classes(this.className, this.extraClassName)}}}
                  aria-label="{{{this.ariaLabel}}}"
                  <%= this.enabled ? '' : 'disabled' %>>
            {{{this.label}}}
          </button>
        <% } %>
      */}
    }
  ],

  listeners: [
    {
      name: 'onClick',
      code: function() {
        if (typeof this.action === 'string' && this.data[this.action]) {
          this.data[this.action]();
        } else if (typeof this.action === 'function') {
          this.action.apply(this.data);
        }
      }
    }
  ],

  methods: [
    {
      name: 'initHTML',
      help: 'Dynamically update based on label, title, and enabled properties.',
      code: function() {
        this.SUPER();
        ['label', 'title', 'enabled'].forEach(function(propName) {
          this[propName + '$'] = this.data[propName + '$'];
        }.bind(this));
        if (this.$) {
          this.$.addEventListener('click', this.onClick);
        }
      }
    }
  ]
});

MODEL({
  name: 'LocationBarView',
  extendsModel: 'DetailView',
  traits: [
    'CSSClassesTrait',
    'ViewVisibilityTrait',
    'ViewEnableabilityTrait',
    'StateBinderTrait'
  ],

  properties: [
    {
      model_: 'StringProperty',
      name: 'placeholder',
      defaultValue: 'http://www.example.com'
    },
    {
      model_: 'StringProperty',
      name: 'bttnLabel',
      defaultValue: 'Go'
    },
    {
      model_: 'StringProperty',
      name: 'formClass',
      defaultValue: 'location-form'
    },
    {
      model_: 'StringProperty',
      name: 'textInputClass',
      defaultValue: 'location'
    },
    {
      name: 'webview',
      help: 'Expects parent to be a KioskView.',
      getter: function() {
        return $(this.parent.id + '-webview');
      }
    },
    {
      name: 'text',
      getter: function() {
        return $(this.id + '-text');
      }
    },
    {
      name: 'button',
      getter: function() {
        return $(this.id + '-button');
      }
    }
  ],

  methods: {
    initHTML: function() {
      this.SUPER();
      if (this.$) {
        this.$.addEventListener('submit', this.onSubmit);
      }
    }
  },

  listeners: [
    {
      name: 'onSubmit',
      code: function(event) {
        event.preventDefault();
        this.webview.src = this.text.value;
      }
    }
  ],

  templates: [
    function toHTML() {/* {{{this.toInnerHTML()}}} */},
    {
      name: 'toHTML',
      help: 'Use this.visible to decide whether or not to render address bar.',
      template: function() {/*
        <% if (this.visible) { %>
          <form id="{{{this.id}}}" {{{this.classes(this.formClass)}}}>
            {{{this.toInnerHTML()}}}
          </form>
        <% } %>
        */}
    },
    {
      name: 'toInnerHTML',
      template: function() {/*
        <input id="{{{this.id}}}-text"
               type="text" {{{this.classes(this.textInputClass)}}}
               placeholder="{{{this.placeholder}}}">
        <input id="{{{this.id}}}-button"
               type="submit" value="{{{this.bttnLabel}}}">
      */}
    }
  ]
});

