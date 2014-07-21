using GameMaker.ModelStructure;
using GameMaker.ModelStructure.Units;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Assembly = System.Reflection.Assembly;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace GameMaker
{
	/// <summary>
	/// The main class of the game maker. Use it to generate the game code from a <see cref="GameModel"/>
	/// </summary>
	public class JsGenerator
	{
		private static readonly string BackgroundPlaceholder = @"//<!--BACKGROUND-->";
		private static readonly string UnitsPlaceholder = @"//<!--UNITS-->";
		private static readonly string KeyBindingsPlaceholder = @"//<!--KEYBINDINGS-->";
		private static readonly string DrawPlaceholder = @"//<!--DRAW-->";
		private static readonly string ModulesPlaceholder = @"//<!--MODULES-->";
		private string gameTemplate;
		private Dictionary<string, Module> presetModules;

		/// <summary>
		/// Constructs a new <see cref="JsGenerator"/> using the specified <see cref="ModuleCollection"/>.
		/// </summary>
		/// <param name="modules"></param>
		public JsGenerator(ModuleCollection modules)
		{
			if (modules == null)
				throw new ArgumentNullException("modules");

			gameTemplate = PathFinder.ReadEmbeddedFile(PathFinder.GameTemplateFile);
			presetModules = modules.ToDictionary(x => x.Name);
		}

		/// <summary>
		/// Generates the javascript code for the game described in the specified model.
		/// </summary>
		/// <param name="model">The model that describes the game.</param>
		public string GenerateGameCode(GameModel model)
		{
			if (model == null)
				throw new ArgumentNullException("model");

			Thread.CurrentThread.CurrentCulture = CultureInfo.InvariantCulture;

			UpdateModules(model.Units);
			UpdateModules(model);

			var unitModules = new ModuleCollection();
			foreach (var unit in model.Units)
			{
				unitModules = new ModuleCollection(unitModules.Union(unit.Modules, Module.Comparer));
			}

			string background = model.Background.GenerateCode();
			string modules = unitModules.GenerateUnitModulesCode() + "\n" + model.Modules.GenerateGameModulesCode();
			string unitConstructors = GenerateUnitConstructors();
			string units = unitConstructors + model.Units.GenerateCollectionCode((unit) => unit.GenerateCode());
			string bindings = model.KeyBindings.GenerateCollectionCode((binding) => binding.GenerateCode());

			string game = Regex.Replace(gameTemplate, BackgroundPlaceholder, background, RegexOptions.None);
			game = Regex.Replace(game, ModulesPlaceholder, modules, RegexOptions.None);
			game = Regex.Replace(game, UnitsPlaceholder, units, RegexOptions.None);
			game = Regex.Replace(game, KeyBindingsPlaceholder, bindings, RegexOptions.None);

			return game;
		}

		/// <summary>
		/// Finds all <see cref="GameMaker.ModelStructure.Units.Unit"/> subclasses and uses their name to find a .js file containing the generated javascript for each 
		/// of them
		/// </summary>
		/// <returns>The code for every single <see cref="GameMaker.ModelStructure.Units.Unit"/> subclass.</returns>
		private string GenerateUnitConstructors()
		{
			var typeOfUnit = typeof(Unit);
			var code = new StringBuilder();
            var assembly = Assembly.GetExecutingAssembly();
			foreach (Type type in assembly.GetTypes())
			{
				if (type.IsSubclassOf(typeOfUnit))
				{
					var constructor = PathFinder.ReadEmbeddedFile(type.Name + ".js");
					code.AppendFormat("\tvar {0} = ", type.Name);
					code.Append("(" + constructor + ")();\n");
				}
			}
			return code.ToString();
		}

		/// <summary>
		/// Updates the function body and invokable property of all modules of all IExtensibles in the collection.
		/// </summary>
		/// <param name="extensibles">The collection, whose element's modules to update.</param>
		private void UpdateModules(IEnumerable<IExtensible> extensibles)
		{
			foreach (var extendable in extensibles)
			{
				UpdateModules(extendable);
			}
		}

		/// <summary>
		/// Updates the function body and the invokable property of all modules in this IExtensible
		/// </summary>
		/// <param name="extensible">The object to update modules upon.</param>
		private void UpdateModules(IExtensible extensible)
		{
			foreach (var module in extensible.Modules)
			{
				module.FunctionBody = presetModules[module.Name].FunctionBody;
				module.IsInvokable = presetModules[module.Name].IsInvokable;
			}
		}
	}
}
