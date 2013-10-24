using GameMaker.ModelStructure;
using GameMaker.ModelStructure.Units;
using Newtonsoft.Json;
using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Xml.Serialization;

namespace GameMaker
{
	class Program
	{
		public static void Main(string[] args)
		{
			Thread.CurrentThread.CurrentCulture = CultureInfo.InvariantCulture;

			var rootPath = @"..\..\..\GameMaker\Data\";
			var serializer = new XmlSerializer(typeof(GameModel));
			var modelXml = File.OpenRead(Path.Combine(rootPath, @"Xml\EmptyModel.xml"));
			var model = serializer.Deserialize(modelXml) as GameModel;
			var moduleSerializer = new XmlSerializer(typeof(ModuleCollection));
			var events = moduleSerializer.Deserialize(File.OpenRead(Path.Combine(rootPath, @"Xml\DefaultEvents.xml"))) as ModuleCollection;
			
			var json = @"{""units"":[{""$type"":""GameMaker.InanimatedSpriteUnit, JsGameGenerator"",""texture"":""images/library/laser.png"",""id"":""bullet"",""modules"":[],""position"":{""x"":50,""y"":200},""rotation"":{""x"":0,""y"":0},""velocity"":{""x"":0,""y"":0},""size"":{""width"":40,""height"":40},""hp"":1,""isPrototype"":true},{""$type"":""GameMaker.InanimatedSpriteUnit, JsGameGenerator"",""texture"":""images/library/spaceship.png"",""id"":""Basic110"",""modules"":[{""name"":""attack"",""args"":[{""name"":""ammo"",""value"":""'bullet'"",""isArray"":false,""annotation"":""The unit to be spawned as ammo. Optional if the unit is melee.""},{""name"":""ammoX"",""value"":""this.x"",""isArray"":false,""annotation"":""The x coordinate to spawn the ammo at.""},{""name"":""ammoY"",""value"":""this.y"",""isArray"":false,""annotation"":""The y coordinate to spawn the ammo at.""},{""name"":""ammoDx"",""value"":""0"",""isArray"":false,""annotation"":""The velocity at Ox to to spawn the ammo with.""},{""name"":""ammoDy"",""value"":""-2"",""isArray"":false,""annotation"":""The velocity at Oy to to spawn the ammo with.""},{""name"":""damage"",""value"":null,""isArray"":false,""annotation"":""Amount of damage the unit does to its enemy. Used only in melee combat""}],""invocationArgs"":[],""annotation"":""Attack, mudafaka"",""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""name"":true,""args[0].name"":true,""args[0].value"":true,""args[0].isArray"":true,""args[0].annotation"":true,""args[1].name"":true,""args[1].value"":true,""args[1].isArray"":true,""args[1].annotation"":true,""args[2].name"":true,""args[2].value"":true,""args[2].isArray"":true,""args[2].annotation"":true,""args[3].name"":true,""args[3].value"":true,""args[3].isArray"":true,""args[3].annotation"":true,""args[4].name"":true,""args[4].value"":true,""args[4].isArray"":true,""args[4].annotation"":true,""args[5].name"":true,""args[5].value"":true,""args[5].isArray"":true,""args[5].annotation"":true,""args"":true,""invocationArgs"":true,""annotation"":true},""copiedProperties"":{}}}],""position"":{""x"":346.1038961038961,""y"":336},""rotation"":{""x"":0,""y"":0},""velocity"":{""x"":0,""y"":0},""size"":{""width"":40,""height"":40},""hp"":1,""isPrototype"":false,""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""$type"":true,""texture"":true,""id"":true,""modules"":true,""position.x"":true,""position.y"":true,""position"":true,""rotation.x"":true,""rotation.y"":true,""rotation"":true,""velocity.x"":true,""velocity.y"":true,""velocity"":true,""size.width"":true,""size.height"":true,""size"":true,""hp"":true,""isPrototype"":true},""copiedProperties"":{}}},{""$type"":""GameMaker.InanimatedSpriteUnit, JsGameGenerator"",""texture"":""images/library/asteroid.png"",""id"":""asteroid"",""modules"":[],""position"":{""x"":189.6103896103896,""y"":57},""rotation"":{""x"":0,""y"":0},""velocity"":{""x"":0,""y"":0},""size"":{""width"":40,""height"":40},""hp"":1,""isPrototype"":false,""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""$type"":true,""texture"":true,""id"":true,""modules"":true,""position.x"":true,""position.y"":true,""position"":true,""rotation.x"":true,""rotation.y"":true,""rotation"":true,""velocity.x"":true,""velocity.y"":true,""velocity"":true,""size.width"":true,""size.height"":true,""size"":true,""hp"":true,""isPrototype"":true},""copiedProperties"":{}}}],""keyBindings"":[{""key"":49,""target"":"""",""action"":"""",""args"":[],""single-call"":""true"",""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""key"":true,""target"":true,""action"":true,""args"":true,""single-call"":true},""copiedProperties"":{}}}],""mouseBindings"":[],""modules"":[{""name"":""collider"",""args"":[],""invocationArgs"":[],""annotation"":""Notifies units about collisions. Required."",""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""name"":true,""args"":true,""invocationArgs"":true,""annotation"":true},""copiedProperties"":{}}},{""name"":""unit-generator"",""args"":[],""invocationArgs"":[],""annotation"":""Used to spawn units from unit prototypes. Other modules depend on this one."",""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""name"":true,""args"":true,""invocationArgs"":true,""annotation"":true},""copiedProperties"":{}}}],""background"":{""texture"":""images/library/space.jpg""},""__ko_mapping__"":{""ignore"":[],""include"":[""_destroy""],""copy"":[],""observe"":[],""mappedProperties"":{""units[0].$type"":true,""units[0].texture"":true,""units[0].id"":true,""units[0].modules"":true,""units[0].position.x"":true,""units[0].position.y"":true,""units[0].position"":true,""units[0].rotation.x"":true,""units[0].rotation.y"":true,""units[0].rotation"":true,""units[0].velocity.x"":true,""units[0].velocity.y"":true,""units[0].velocity"":true,""units[0].size.width"":true,""units[0].size.height"":true,""units[0].size"":true,""units[0].hp"":true,""units[0].isPrototype"":true,""units"":true,""keyBindings"":true,""mouseBindings"":true,""modules"":true,""background.texture"":true,""background"":true},""copiedProperties"":{}}}";

			string presetModulesPath = Path.Combine(rootPath, @"Xml\PresetModules.xml");

			using (var file = File.OpenRead(presetModulesPath))
			{
				var modules = moduleSerializer.Deserialize(file) as ModuleCollection;
				var generator = new JsGenerator(modules);
				var game = generator.GenerateGameCode(model);

				SerializeAsJson(model, Path.Combine(rootPath, @"Xml\model.json"));
				SerializeAsJson(modules, Path.Combine(rootPath, @"Xml\modules.json"));
				SerializeAsJson(events, Path.Combine(rootPath, @"Xml\events.json"));

				var models = (from thing in Assembly.GetAssembly(typeof(Unit)).GetTypes()
							 where thing.IsClass && thing.Namespace == "GameMaker.Model_Structure.Units"
							 select thing).ToList();
				var attributeType = typeof(GameMaker.ModelStructure.EditorFieldAttribute);

				var data = GameMaker.ModelStructure.Helper.GetTypeAttributesData(models, attributeType,
					attributeType.GetProperty("Type"));

				string baseModelTemplate = "template = {0}";
				json = JsonConvert.SerializeObject(data, Formatting.None);
				File.WriteAllText(Path.Combine(rootPath, "data/baseModel.js"), string.Format(baseModelTemplate, json));

				//SerializeAsJson(data, Path.Combine(rootPath, "baseModel.json"));

				File.WriteAllText(Path.Combine(rootPath, @"game.js"), game, Encoding.UTF8);
			}

			Console.WriteLine("Done!");
		}

		private static void SerializeAsJson(Object model, string path)
		{
			TextWriter writer = new StringWriter();
			var json = JsonConvert.SerializeObject(model, Formatting.None);
			writer.Write(json);

			File.WriteAllText(path, writer.ToString());
		}
	}
}
