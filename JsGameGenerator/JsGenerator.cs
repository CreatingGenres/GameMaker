using GameMaker.Model_Structure.Units;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
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
		private static string BackgroundPlaceholder = @"//<!--BACKGROUND-->";
		private static string UnitsPlaceholder = @"//<!--UNITS-->";
		private static string KeyBindingsPlaceholder = @"//<!--KEYBINDINGS-->";
		private static string DrawPlaceholder = @"//<!--DRAW-->";
		private static string ModulesPlaceholder = @"//<!--MODULES-->";
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
			return GenerateGameCode(model, new ModuleCollection());
		}

		/// <summary>
		/// Generates the javascript code for the game described in the specified model and using the given default unit presetModules.
		/// </summary>
		/// <param name="model">The model that describes the game.</param>
		/// <param name="defaultUnitModules">A collection of presetModules to be included to each unit.</param>
		/// <returns></returns>
		public string GenerateGameCode(GameModel model, ModuleCollection defaultUnitModules)
		{
			if (model == null)
				throw new ArgumentNullException("model");

			if (defaultUnitModules == null)
				throw new ArgumentNullException("defaultUnitModules");

			Thread.CurrentThread.CurrentCulture = CultureInfo.InvariantCulture;

			UpdateModules(model.Units);
			UpdateModules(model);
			foreach (var unit in model.Units)
			{
				unit.Modules.AddRange(defaultUnitModules);
			}

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
			bindings += model.MouseBindings.GenerateCollectionCode((binding) => binding.GenerateCode());

			var game = Regex.Replace(gameTemplate, BackgroundPlaceholder, background, RegexOptions.None);
			game = Regex.Replace(game, ModulesPlaceholder, modules, RegexOptions.None);
			game = Regex.Replace(game, UnitsPlaceholder, units, RegexOptions.None);
			game = Regex.Replace(game, KeyBindingsPlaceholder, bindings, RegexOptions.None);

			return game;
		}

		//REVIEW: Why the reflection?
		private string GenerateUnitConstructors()
		{
			var typeOfUnit = typeof(Unit);
			var code = new StringBuilder();
			foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
			{
				foreach (var type in assembly.GetTypes())
				{
					if (type.IsSubclassOf(typeOfUnit))
					{
						var constructor = PathFinder.ReadEmbeddedFile(type.Name + ".js");
						code.AppendFormat("\tvar {0} = ", type.Name);
						code.Append("(" + constructor + ")();\n");
					}
				}
			}
			return code.ToString();
		}

		private void UpdateModules(IEnumerable<IExtensible> extensibles)
		{
			foreach (var extendable in extensibles)
			{
				UpdateModules(extendable);
			}
		}

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
