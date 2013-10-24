using Newtonsoft.Json;
using System.Xml.Serialization;

namespace GameMaker.ModelStructure.Units
{
	public struct Size
	{
		[EditorFieldAttribute(EditorFieldAttribute.EditorType.Formula)]
		[XmlAttribute("width")]
		[JsonProperty("width", DefaultValueHandling = DefaultValueHandling.Include)]
		public string Width { get; set; }

		[EditorFieldAttribute(EditorFieldAttribute.EditorType.Formula)]
		[XmlAttribute("height")]
		[JsonProperty("height", DefaultValueHandling = DefaultValueHandling.Include)]
        public string Height { get; set; }
	}
}
