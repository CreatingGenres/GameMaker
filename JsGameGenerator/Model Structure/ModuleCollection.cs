using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker
{
	[XmlRoot("modules")]
	[JsonArray("modules", AllowNullItems = true)]
	public class ModuleCollection : List<Module>
	{
		public ModuleCollection(IEnumerable<Module> enumerable) :
			base(enumerable)
		{ }

		public ModuleCollection()
		{ }

		public string GenerateGameModulesCode()
		{
			var builder = new StringBuilder();

			foreach (var module in this)
			{
				builder.AppendFormat(
		@"var module = createModule('{0}', {1});
		$.extend(module, ({2})());
		modules['{0}'] = module;
		", module.Name, module.FormatArgs(), module.FunctionBody);
			}
			return builder.ToString();
		}

		public string GenerateUnitModulesCode()
		{
			var builder = new StringBuilder();
			foreach (var module in this)
			{
				var firstBracketIndex = module.FunctionBody.IndexOf('{') + 1;

				var modifiedFunctionBody = module.FunctionBody.Insert(firstBracketIndex, string.Format(" raiseEvent(this, '{0}', arguments[0]); ", module.Name));

				builder.AppendFormat("unitModules['{0}'] = {1};\n", module.Name, modifiedFunctionBody);
			}
			return builder.ToString();
		}

		public string GenerateModuleObjectCode()
		{
			// Create an dictionary to store the non-invocation args foreach module
			StringBuilder moduleData = new StringBuilder();
			foreach (var module in this)
			{
				moduleData.AppendFormat(CultureInfo.InvariantCulture, "moduleData['{0}'] = {1};\n", module.Name, module.FormatArgs());
			}

			// Use an annonimous self-calling function to create an object that holds the implementation of all unit modules. Use the generated object to extend the unit
			StringBuilder moduleObject = new StringBuilder();
			moduleObject.AppendFormat(CultureInfo.InvariantCulture,
	@"(function () {{
		var moduleData = [];
		{0}
		return {{
				", moduleData);
			foreach (Module module in this)
			{
				moduleObject.AppendFormat(CultureInfo.InvariantCulture,
	@"
		{0} : unitModules['{0}'], 
	", module.Name);

			}
			moduleObject.Append("\tmoduleData: moduleData");
			moduleObject.Append(@"
		};
	})()");
			return moduleObject.ToString();
		}
    }
}
