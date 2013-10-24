using GameMaker.ModelStructure.Units;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Xml.Serialization;

namespace GameMaker.ModelStructure
{
	[XmlInclude(typeof(InanimatedSpriteUnit))]
	[XmlInclude(typeof(AnimatedSpriteUnit))]
	[XmlInclude(typeof(RectangleUnit))]
	[XmlType("gameModel")]
	[JsonObject(Id="gameModel")]
	public class GameModel : IExtensible
	{
		/// <summary>
		/// Gets or sets the name of the game.
		/// </summary>
		[XmlAttribute("name")]
		[JsonProperty("name")]
		public string Name;

        /// <summary>
        /// A collection of units and their prototypes. 
        /// Has the <see cref="Newtonsoft.Json.TypeNameHandling.Auto"/> attribute to keep track of type of the unit even in json (Rectangle, Animated, etc)
        /// </summary>
		[XmlArray("units")]
		[JsonProperty("units", ItemTypeNameHandling=TypeNameHandling.Auto)]
		public List<Unit> Units;

		[XmlArray("keyBindings")]
		[JsonProperty("keyBindings")]
		public List<KeyBinding> KeyBindings;

		[XmlArray("modules")]
		[JsonProperty("modules")]
		public ModuleCollection Modules { get; set; }

		[XmlElement("background")]
		[JsonProperty("background", DefaultValueHandling=DefaultValueHandling.Include)]
		public Background Background { get; set; }

		public GameModel()
		{
			this.Name = string.Empty;
			this.Background = new Background();
		}

		public enum SupportedSaveFormats
		{
			Xml,
			Json
		}

		public void SaveAs(SupportedSaveFormats format, StreamWriter saveLocation)
		{
			switch (format)
			{
				case SupportedSaveFormats.Json:
					JsonSerializer jsonSerializer = new JsonSerializer();
					jsonSerializer.Serialize(saveLocation, this);		
					break;
				case SupportedSaveFormats.Xml:
					XmlSerializer xmlSerializer = new XmlSerializer(typeof(GameModel));
					xmlSerializer.Serialize(saveLocation, this);
					break;
			}
		}

		public static GameModel Load(SupportedSaveFormats format, StreamReader loadLocation)
		{
			switch (format)
			{
				case SupportedSaveFormats.Json:
					JsonSerializer jsonSerializer = new JsonSerializer();
					return jsonSerializer.Deserialize(loadLocation, typeof(GameModel)) as GameModel;
				case SupportedSaveFormats.Xml:
					XmlSerializer xmlSerializer = new XmlSerializer(typeof(GameModel));
					return xmlSerializer.Deserialize(loadLocation) as GameModel;
				default:
					throw new NotSupportedException("Invalid save format");
			}
		}
	}
}
