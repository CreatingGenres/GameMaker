using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker.ModelStructure
{
	/// <summary>
	/// Represents a single module that is either:
	/// <para>
	///		1. A function to be attached to and called on a given unit.
	///	</para>
	///	<para>
	///		2. An object attached to the game. This object can do whatever it wants with the units. It may optionally have an update and draw functions that are called
	///		at every frame.
	/// </para>
	/// </summary>
	[XmlType("module")]
    [XmlInclude(typeof(Event))]
	public class Module
	{
		public readonly static IEqualityComparer<Module> Comparer = new Helper.EqualityComparer<Module>(((x, y) => x.Name == y.Name), (x) => x.Name.GetHashCode());
		
		private string functionBody = string.Empty;

		/// <summary>
		/// Gets or sets the name of the module.
		/// </summary>
		[XmlAttribute("name")]
		[JsonProperty("name", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Name { get; set; }

		/// <summary>
		/// Gets or sets the list of arguments. Those are the arguments that are set only once for the module (i.e. the font of the points module).
		/// </summary>
		[XmlArrayItem("argument")]
		[XmlArray("args")]
		[JsonProperty("args")]
		public List<ModuleArgument> Args { get; set; }

		/// <summary>
		/// Gets or sets the list of invocation arguments. Those are the arguments with which the module is called (i.e. the vector of the move module). 
		/// </summary>
		[XmlArrayItem("argument")]
		[XmlArray("invocationArgs")]
		[JsonProperty("invocationArgs")]
        public List<ModuleArgument> InvocationArgs { get; set; }

		/// <summary>
		/// Gets or sets the function of the module.
		/// </summary>
		[XmlElement("function")]
		[JsonIgnore]
		public string FunctionBody 
		{ 
			get { return this.functionBody; }
			set { this.functionBody = value.Trim(); }
		}

        /// <summary>
        /// Gets or sets a value indicating whether this module is invokable.
        /// </summary>
        [JsonProperty("isInvokable")]
        [XmlAttribute("isInvokable")]
        public bool IsInvokable { get; set; }

		[XmlAttribute("annotation")]
		[JsonProperty("annotation", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Annotation { get; set; }

		public string FormatArgs()
		{
			string formatted = "(function() { var data = []; ";

			foreach (var arg in Args)
			{
				if (arg.IsArray)
				{
					//REVIEW: What a beauty {{{Mclovin' it}}}. DRY principle here badly violated.
					formatted += string.Format("data['{0}'] = new Object({{{1}}}); ", arg.Name, arg.Value);
				}
				else
				{
					formatted += string.Format("data['{0}'] = \"{1}\"; ", arg.Name, arg.Value);
				}
			}
			formatted += " return data; })()";
			return formatted;
		}
	}

	//REVIEW: Maybe nest this and Module?
	public class ModuleArgument
	{
		[XmlAttribute("name")]
		[JsonProperty("name", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Name { get; set; }

		[XmlAttribute("value")]
		[JsonProperty("value", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Value { get; set; }

		[XmlAttribute("isArray")]
		[JsonProperty("isArray", DefaultValueHandling=DefaultValueHandling.Include)]
		public bool IsArray { get; set; }

		[XmlAttribute("annotation")]
		[JsonProperty("annotation", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Annotation { get; set; }

		[XmlAttribute("valueType")]
		[JsonProperty("valueType", DefaultValueHandling = DefaultValueHandling.Include)]
        public EditorFieldAttribute.EditorType ValueType { get; set; }
	}
}
