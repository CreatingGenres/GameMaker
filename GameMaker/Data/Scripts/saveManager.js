/* DEPENDS ON: knockout */

var saveManager = (function () {

	var Save = function Save(name, data) {
		this.name = name;
		this.data = data;
		this.timestamp = new Date();
	};

	var saveManager = {
		saveFiles: ko.observableArray(),
	};

	// Variables to hold values for unnamed saves
	var specialValues = {
		unnamedPrefix: "Unnamed_",
		lastUnnamedIndex: 0,
		localStorageSaveKey: "saves",
	};

	var calculateUnnamedIndex = function () {
		var unnamedIndex = 0;

		// Loop trough all saves and find the unnamed one with the highest index
		var saves = saveManager.saveFiles();
		for (var i = 0; i < saves.length; i++) {
			var save = saves[i];
			if (save.name.startsWith(specialValues.unnamedPrefix)) {
				var currentUnnamedIndex = ~~save.name.replace(specialValues.unnamedPrefix, "");
				if (currentUnnamedIndex > unnamedIndex) {
					unnamedIndex = currentUnnamedIndex;
				}
			}
		}
		return unnamedIndex;
	};


	// The next 4 functions are a single polyfill. We may not serialize undefined values as json. The model contains some values that just happen to be undefined
	// at certain times. Therefore, the save manager and only it uses the jsonStringifyUndefined / jsonParseUndefined  to deal with it. Note - null values wont persist when 
	// deserialized, instead they'll be replace with undefined.
	var deepCopy = function deepCopy(obj) {
		if (obj == null || typeof (obj) != 'object' || obj.nodeName)
			return obj;

		var temp = new obj.constructor(); // changed

		for (var key in obj)
			temp[key] = deepCopy(obj[key]);
		return temp;
	}

	/// <summary>
	/// Loops trough all properties of the object and replaces all occurrences of valueToReplace with replacer.
	/// </summary>
	var replaceSpecialValue = function (obj, valueToReplace, replacer) {
		for (var i in obj) {
			if (obj[i] instanceof Object && !(obj[i] instanceof Function)) {
				replaceSpecialValue(obj[i], valueToReplace, replacer);
			}
			else {
				if (obj[i] === valueToReplace) {
					obj[i] = replacer;
				}
			}
		}
	};

	/// <summary>
	/// Properly stringifies an object that contains undefined values
	/// </summary>
	var jsonStringifyUndefined = function (obj) {
		obj = deepCopy(obj);
		replaceSpecialValue(obj, undefined, null);
		return JSON.stringify(obj);
	};
	/// <summary>
	/// Properly parses an json that contains null values instead of undefineds.
	/// </summary>
	var jsonParseUndefined = function (json) {
		var obj = JSON.parse(json);
		replaceSpecialValue(obj, null, undefined);
		return obj;
	};

	// End of polyfill

	(function initializeManager() {
		var savesAsJson = localStorage.getItem(specialValues.localStorageSaveKey);
		var existingSaves = JSON.parse(savesAsJson) || {}; // If undefined, set it to an empty object so that the next call doesn't trow
		Object.keys(existingSaves).forEach(function (value, index) {
			var save = existingSaves[index];
			// Parsing a Date object returns a string so we need to explicitly set the date. 
			// Check that JSON.parse(JSON.stringify(new Date())) returns a string if you don't believe
			save.timestamp = new Date(save.timestamp);
			saveManager.saveFiles.push(save);
		});
		specialValues.lastUnnamedIndex = calculateUnnamedIndex();
	})();


	var saveToStorage = function () {
		var saves = saveManager.saveFiles();
		saves = jsonStringifyUndefined(saves);
		localStorage.setItem(specialValues.localStorageSaveKey, saves);
	};

	var setViewModel = function (model) {
	    for (var property in gameMakerViewModel.model) {
	        var isPropertyObservable = ko.isObservable(gameMakerViewModel.model[property]);

	        if (gameMakerViewModel.model.hasOwnProperty(property)) {
	            if (isPropertyObservable) {
	                gameMakerViewModel.model[property](model[property]());
	            } else {
	                gameMakerViewModel.model[property] = model[property];
	            }
	        }
		}

		// WARNING: Special purpose code. Event target/module should be simply strings, not observables.
		var units = gameMakerViewModel.model.units();
		for (var unit in units) {
			var events = units[unit].events();
			for (var event in events) {
				events[event].action.target = events[event].action.target();
				events[event].action.module = events[event].action.module();
			}
		}

	    //About textures: they are added to the library before the renderer can
	    //display them. We need to add all new textures to our library

	    //First, master reset
		var library = new Library();

	    //Background
		var background = gameMakerViewModel.model.background.texture();
		if (library.images.indexOf(background) == -1)
		    library.images.push(background);

	    //Unit textures
		for (var i in units) {
		    var unit = units[i];
		    if (library.images.indexOf(unit.texture()) == -1)
		        library.images.push(unit.texture());
		}

        //We're done, update the view model
        gameMakerViewModel.library = library;
		renderer.updateTextures();
		renderer.updateViewModel(gameMakerViewModel);
	}

	/// <summary>Saves the specified viewModel into a new save slot with the given name.</summary>
	/// <param name="viewModel" type="Object">The viewModel to save</param>
	/// <param name="saveName" type="String">The name of the save.</param>
	saveManager.save = function (viewModel, saveName) {
		// If no name is specified, set the name to be Unnamed_Index where index is the last available.
		saveName = saveName ? saveName : specialValues.unnamedPrefix + ++specialValues.lastUnnamedIndex;
		var model = ko.mapping.toJS(viewModel.model);
		var modelAsJson = jsonStringifyUndefined(model);
		var save = new Save(saveName, modelAsJson);
		saveManager.saveFiles.push(save);
		saveToStorage();
	}

	/// <summary>Loads the viewModel from the save with the specified name.</summary>
	/// <param name="saveName" type="String">The name of the save.</param>
	saveManager.load = function (saveName) {
		if (!saveName) {
			throw new Error("Empty save name!");
		}
		
		var save = undefined;
		var saves = saveManager.saveFiles();
		for (var i = 0; i < saves.length; i++) {
			var currentSave = saves[i];
			if (currentSave.name == saveName) {
				save = currentSave;
			}
		}

		if (!save) {
			throw new Error("No such save");
		}

		var backup = ko.mapping.fromJS(ko.mapping.toJS(gameMakerViewModel.model));
		try {
			var model = jsonParseUndefined(save.data);
			model = ko.mapping.fromJS(model);
			setViewModel(model);
		} catch (e) {
			console.log("Error loading save - ", e.toString());

			setViewModel(backup);

			return false;
		}
		return true;
	}

	/// <summary>Deletes the viewModel with the specified name.</summary>
	/// <param name="saveName" type="String">The name of the save.</param>
	saveManager.delete = function (saveName) {
		saveManager.saveFiles.remove(function (x) {
			return x.name == saveName;
		});
		saveToStorage();
		// If we've removed the last unnamed, decrement the index
		if (saveName.startsWith(specialValues.unnamedPrefix)) {
			specialValues.lastUnnamedIndex--;
		}
	}

	return saveManager;
})();