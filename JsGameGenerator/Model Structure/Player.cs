using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker
{
	//REVIEW: Do you use this?
	/// <summary>
	/// Represents a single player in the game.
	/// </summary>
	[XmlType("player")]
	public class Player
	{
		/// <summary>
		/// Gets or sets the name of the player.
		/// </summary>
		[XmlAttribute("name")]
		[JsonProperty("name", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Name { get; set; }
	}

}
