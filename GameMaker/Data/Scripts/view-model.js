function GameMakerViewModel(model, unitModules, gameModules, events, library) {
    var self = this;

    //mapping here
    this.model = ko.mapping.fromJS(model);
    this.unitModules = ko.mapping.fromJS(unitModules);
    this.gameModules = ko.mapping.fromJS(gameModules);
    this.modules = ko.mapping.fromJS(unitModules.concat(gameModules));
    this.events = ko.mapping.fromJS(events);
    this.library = library;

	// HAAAACK
    this.saveFiles = saveManager.saveFiles;
    this.publishedGames = ko.observableArray();
    
    //Kolio hack
    for (var unit in this.model.units)
        for (var event in this.model.units[unit].events)
            this.model.units[unit].events[event].id = ko.observable(event);
   
    //more Kolio hack
    this.hasPointsModule = function () {
        for (var i in self.model.modules())
            if (self.model.modules()[i].name() == "points")
                return true;
        return false;
    };
    
    this.invokableGameModules = ko.computed(function () {
        return ko.utils.arrayFilter(self.model.modules(), function (module) {
            return module.isInvokable();
        })
    });
    
	//The first one is the property we are editing and IS an observable <see ref dialogs.js/_beginEdit>
	//The type is the one that knockout looks to for changes
    this.editedProperty = ko.observable();

    this.selectedUnit = ko.observable(emptyUnit);
    this.selectedModule = ko.observable(emptyModule);
    this.selectedBinding = ko.observable(emptyBinding);
    this.editedEvent = ko.observable(emptyEvent);
    
    this.eventList = ko.computed(function () {
        return self.selectedUnit().modules().concat(self.events());
    });

    function addUnit(unit) {
        self.model.units.push(unit);
    }
    
    this.placeUnit = function placeUnit (unit) {
        //undo
        //Undo pattern description:
        //We have two sets of function for each operation:
        //  one public:     this.add/place*, this.remove/delete*
        //  one private:    add/place*, remove/delete*
        //In most cases, the local function are wrappers for another function.
        //That might mean to you that we can substitute them - WRONG.
        //We could, but the function scopes and the names that the undo managers displays
        //will be crap. So, there you go.
        GM.UndoManager.addAction(new GM.UndoManager.ViewModelAction(deleteUnit, addUnit, unit, self));

        addUnit(unit);
    };

    function deleteUnit(unit) {
        //undo
        //
        //this.undoStack.push(new ViewModelAction(self.placeUnit, unit, self));

        self.model.units.remove(function (item) {
            return item.id() == unit.id();
        });
    }

    this.deleteSelectedUnit = function () {
        //can't delete basic unit, basic is always the first unit
        if (self.selectedUnit() == self.model.units()[0])
            return;

        GM.UndoManager.addAction(new GM.UndoManager.ViewModelAction(addUnit, deleteUnit, unit, self));

        deleteUnit(self.selectedUnit());

        self.selectedUnit(emptyUnit);
    };

    this.cloneProto = function () {
        var clone = ko.mapping.fromJS(ko.toJS(self.selectedUnit()));
        clone.isPrototype(true);
        self.model.units.push(clone);
        self.selectedUnit(self.selectedUnit());
    };

    this.changeBindingsArgs = function () {

    	// DAFUQ: Insert empty lines between the condition and the body, I thought all the rows were the condition
    	self.editedProperty().action(self.targetModuleName());

    	var prefix = self.selectedUnit().isPrototype() ? "." : "#";
    	self.editedProperty().target(prefix + self.selectedUnit().id());
    	// DAFUQ: Function(Function(Function(Function(), param, Function()).Function()))
    	self.editedProperty().args.removeAll();

    	self.editedProperty().args(ko.mapping.fromJS(ko.toJS(Array.findObservable(self.modules(), 'name', self.targetModuleName()).invocationArgs()))());
    }

    function addBinding(binding) {
        self.model.keyBindings.push(binding);

        //TODO: figure out why the next two lines were there
        //PS: it works without them. -Traiko

        //dialogs.beginEdit.call(binding);
        //self.changeBindingsArgs();
    }

    this.addBinding = function () {
        var binding = ko.mapping.fromJS({
            key: 'None',
            target: '#' + self.selectedUnit().id(),
            action: '',
            args: [],
            singleCall: 'true'
        });

        GM.UndoManager.addAction(new GM.UndoManager.ViewModelAction(removeBinding, addBinding, binding, self));
        addBinding(binding);
    };

    function removeBinding(binding) {

        self.model.keyBindings.remove(binding);
    }
    
    this.addEvent = function (data, eventArgs) {
    	//self.selectedUnit().events.push(ko.mapping.fromJS({}));

    	var select = $(eventArgs.target).parent().children(".input-control").children()[0];
    	var selected = $(select.options[select.selectedIndex]).text();
    	var requirements = ko.mapping.fromJS(ko.toJS(gameMakerViewModel.eventRequirements(selected)));

    	selectedEvent = ko.mapping.fromJS({
    		requirements: requirements,
    		name: selected,
    		args: [new KeyValuePair("hp"), new KeyValuePair("dX"),
					new KeyValuePair("dY"), new KeyValuePair("width"),
					new KeyValuePair("height"), new KeyValuePair("stillPlaying"),
					new KeyValuePair("points")
    		],
    		invocationArgs: [],
    		action: {
    			target: "prosto stringche",
    			module: 'more of it',
    			args: [],
    		},
    		annotation: "",
            // TODO: will crash if we remove an event
    		id: gameMakerViewModel.selectedUnit().events().length
    	});

    	selectedEvent.action.target = "";
    	selectedEvent.action.module = "";

        //Because we call slice on the string and if it's observable, it will crash

    	gameMakerViewModel.selectedUnit().events.push(selectedEvent);
    	gameMakerViewModel.editedProperty(selectedEvent);
    };
    
    //region bind
    function listen(ev) {
        self.editedProperty().key(ev.which);
        window.removeEventListener("keydown", listen);
    }
    
    this.listenForBind = function () {
        $("[data-type='listener']").text("Press any key");
        window.addEventListener("keydown", listen);
    };
    
    this.bindingArgValue = function (name) {
    	var binding =
			Array.findObservable(self.editedProperty().args(), 'name', name())
			//||
			//Array.findObservable(self.editedEvent().action.module().invocationArgs(), 'name', name())
        
        return !binding ? '' : binding.value();
    };
    
    this.targetModuleName = ko.observable();
    this.targetModuleArgs = ko.computed({
        read: function () {
            var module = Array.findObservable(self.modules(), 'name', self.targetModuleName());
            
            if (!module)
                return [];
            
            return module.invocationArgs;
        }
    });
    
    this.eventRequirements = function (eventName) {        
        var events = self.events().filter(function(el) { return el.name() == eventName; }),
            modules = self.modules().filter(function(el) { return el.name() == eventName; });
        
        if (events.length)
            return events[0].requirements();
        if (modules.length)
            return modules[0].invocationArgs();
        
        return undefined;
    };

    function addModule(module) {
        this.modules.push(module);
    }

    this.addModule = function (data, eventArgs) {
    	var select = $(eventArgs.target).parent().children(".input-control").children()[0];
    	var selected = $(select.options[select.selectedIndex]).text();

    	var module = Array.findObservable(data.toChooseFrom(), 'name', selected),
            copy = ko.mapping.fromJS(ko.toJS(module));
        
    	addModule.call(data.editedEntity, copy);

    	GM.UndoManager.addAction(new GM.UndoManager.ViewModelAction(removeModule, addModule, copy, data.editedEntity));
    };

    this.removeModule = function (module, eventArgs) {
        removeModule.call(self.selectedUnit(), module);

        GM.UndoManager.addAction(new GM.UndoManager.ViewModelAction(addModule, removeModule, module, self.selectedUnit()));
    }

    function removeModule(module) {
        this.modules.remove(module);
    }

    this.filterUnitModules = ko.computed(function () {
    	// Select only those modules that haven't been added already
    	return ko.utils.arrayFilter(self.unitModules(), function (x) {
    		return !ko.utils.arrayFirst(self.selectedUnit().modules(), function (y) {
    			return x.name() == y.name();
    		});
    	});
    });

	this.filterGameModules = ko.computed(function () {
		// Select only those modules that haven't been added already
		return ko.utils.arrayFilter(self.gameModules(), function (x) {
			return !ko.utils.arrayFirst(self.model.modules(), function (y) {
				return x.name() == y.name();
			});
		});
	}),

    this.getObjectProperties = function (object) {
        if (!object || !object.$type)
            return [];

        var properties = [],
            type = object.$type().split(".");
        // type = type[type.length - 1].split(",")[0].toLowerCase();
        type = type[type.length - 1].split(",")[0];
        for (var i in object) {
            if (object.hasOwnProperty(i)) {
                var propertyType = window.baseModelTemplate[type][capitalizeFirstLetter(i)];
                
                if (propertyType)
                    properties.push({ name: i, binding: object[i], type: propertyType.toLowerCase() });
            }
        }

        return properties;
    }

    this.eventTarget = ko.observable();
    this.eventModule = ko.observable();

	// Annonimous function since I'd rather not pollute the already polluted viewmodel

	// Some explanations:
	// The defaultSubscriber subscribes to editedProperty and whenever editedProperty is changed to an event (it has an action property) it updates the eventTarget as appropriate
	// The targetSubscriber subscribes to eventTarget and takes care of updating propertly the eventModule
	// The moduleSubscriber subscribes to eventModule and takes care of changing the args whenever need
	// ChangeBindingArgs clears whatever value currently the args hold and sets it as appropriate
    (function subscriptions() {
    	var newEventBeingEdited = false;

    	function defaultSubscriber(newValue) {
    		if (!(newValue.action && newValue.invocationArgs)) {
    			return;
    		}
    		var target =
				Array.findObservable(self.model.units(), "id", newValue.action.target.substr(1)) ||
    			self.model.units()[0];

    		self.eventTarget(target);
    	}
    	var newModuleBeingEdited = false;

    	function targetSubscriber(target) {
    		var event = self.editedProperty();
    		var prefix = target.isPrototype() ? "." : "#";
    		event.action.target = prefix + target.id();

    		var module = Array.findObservable(target.modules(), "name", event.action.module);
    		if (!module) {
    			newModuleBeingEdited = true;
    			if (target.modules().length != 0) {
    				module = target.modules()[0];
    			}
    		}

    		if (module)
    			self.eventModule(module);
    	}

    	function moduleSubscriber(newValue) {
    		var event = self.editedProperty();

    		newModuleBeingEdited = newModuleBeingEdited || event.action.module != newValue.name();
    		event.action.module = newValue.name();

    		if (newModuleBeingEdited) {
    			changeEventBindingsArgs(newValue);
    		}
    		newModuleBeingEdited = false;
    	}

    	function changeEventBindingsArgs() {
    		self.editedProperty().action.args.removeAll();

    		var module = Array.findObservable(self.modules(), 'name', self.editedProperty().action.module);
    		console.log("change event args");

    		self.editedProperty().action.args(ko.mapping.fromJS(ko.toJS(module.invocationArgs()))());

    	};

    	self.editedProperty.subscribe(defaultSubscriber);
    	self.eventTarget.subscribe(targetSubscriber);
    	self.eventModule.subscribe(moduleSubscriber);
    })();

    this.googleSearchResults = ko.observableArray();
    
    this.getCleanModel = function getCleanModel() {
        var model = ko.toJS(this.model);
        for (var unit in model.units) {
            for (var ev in model.units[unit].events) {
                var event = model.units[unit].events[ev];
                if (event.action.module.length == 0)
                    delete event.action;
            }
        }
        return JSON.stringify(model);
    };
}

// Dynamically generated file from the server.
var gameMakerViewModel = new GameMakerViewModel(config.model, config.unitModules, config.gameModules, config.events, new Library());
jQuery(document).ready(function () {
    ko.applyBindings(gameMakerViewModel/*, $("#content")[0] Dialog testing, bear with me.*/);
    appNavigator.load();
});