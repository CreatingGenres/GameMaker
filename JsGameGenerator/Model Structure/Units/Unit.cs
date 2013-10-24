using Newtonsoft.Json;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace GameMaker.Model_Structure.Units
{
	/// <summary>
	/// Represents a single unit in the game.
	/// </summary>
	[XmlType("unit")]
	public abstract class Unit : IExtensible, ICodeGenerator
	{
		/// <summary>
		/// Gets or sets the id of the unit.
		/// </summary>
		[EditorField(EditorField.EditorType.Text)]
		[XmlAttribute("id")]
		[JsonProperty("id")]
		public string Id { get; set; }

		/// <summary>
		/// Gets or sets the collection of modules this unit contains.
		/// </summary>
		[EditorField(EditorField.EditorType.None)]
		[XmlArray("modules")]
		[JsonProperty("modules")]
		public ModuleCollection Modules { get; set; }

		/// <summary>
		/// Gets or sets the collection of events this unit contains.
		/// </summary>
		[EditorField(EditorField.EditorType.None)]
		[XmlArray("events")]
		[XmlArrayItem("event")]
		[JsonProperty("events")]    
		public List<Event> Events { get; set; }

		/// <summary>
		/// Gets or sets the position the unit is at.
		/// </summary>
		[EditorField(EditorField.EditorType.None)]
		[XmlElement("position")]
		[JsonProperty("position")]
		public Vector2 Position { get; set; }

		/// <summary>
		/// Gets or sets the rotation of the unit.
		/// </summary>
		[EditorField(EditorField.EditorType.Vector)]
		[XmlElement("rotation")]
		[JsonProperty("rotation")]
		public Vector2 Rotation { get; set; }

		/// <summary>
		/// Gets or sets the velocity vector this unit is moving with.
		/// </summary>
		[EditorField(EditorField.EditorType.Vector)]
		[XmlElement("velocity")]
		[JsonProperty("velocity")]
		public Vector2 Velocity { get; set; }

		/// <summary>
		/// Gets or sets the size of the unit. Used in drawing and collision detection.
		/// </summary>
		[EditorField(EditorField.EditorType.Vector)]
		[XmlElement("size")]
		[JsonProperty("size")]
		public Size Size { get; set; }

		/// <summary>
		/// Gets or sets the health points of the unit. Every unit with HP &lt; 1 is removed from the game. Default is 1.
		/// </summary>
		[EditorField(EditorField.EditorType.Formula)]
		[XmlAttribute("hp")]
		[JsonProperty("hp")]
		public int HealthPoints { get; set; }

		[EditorField(EditorField.EditorType.None)]
		[XmlAttribute("isPrototype")]
		[JsonProperty("isPrototype")]
		public bool IsPrototype { get; set; }

		protected Unit()
		{
			HealthPoints = 1;
			//Events = new List<Event>();
			//Console.WriteLine(Position);
			//Position = Position ?? Vector2.Zero;
			//Rotation = Rotation ?? Vector2.Zero;
			//Size = Size ?? new Size() { Width = 0, Height = 0 };
			//Velocity = Velocity ?? Vector2.Zero;
		}

		/// <summary>
		/// Generates the code that creates the new unit. 
		/// </summary>
		/// <returns></returns>
		public virtual string GenerateCode()
		{
			string code = string.Empty;

			if (Velocity != Vector2.Zero)
			{
				code += string.Format("unit.dx = {0}; unit.dy = {1}\n", Velocity.X, Velocity.Y);
			}

			if (this.Modules.Count != 0)
				code += string.Format(@"$.extend(unit, {0});", this.Modules.GenerateModuleObjectCode());

			if (this.Events.Count != 0)
				code += "unit.events = " + this.Events.GenerateEventsCode();

			if (!this.IsPrototype)
			{
				code += "raiseEvent(unit, 'onSpawn');\n";
			}

			return code;
		}


		
	}
}
