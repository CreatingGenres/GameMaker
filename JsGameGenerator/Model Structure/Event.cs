﻿using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace GameMaker
{
	/// <summary>
	/// Events are special types of modules that are called whenever a specific event occurs in our game. There are 3 basic events:
	/// <para>
	///		OnSpawn, OnCollision, OnDeath
	/// </para>
	/// For every other module that is attached to a given unit, an event is attached is as well. Multiple event handlers may be attached for every event.
	/// </summary>
    [XmlRoot("event")]
    public class Event : Module
    {
		/// <summary>
		/// Gets or sets the list of requirements to be satisfied in order to call the event handler. Event handlers are raised if and only those requirements are satisfied.
		/// </summary>
        [XmlArray("requirements")]
        [XmlArrayItem("requirement")]
        [JsonProperty("requirements")]
        public List<ModuleArgument> Requirements = new List<ModuleArgument>();

		[XmlElement("action")]
		[JsonProperty("action")]
		public Action Action;
    }

	public struct Action
	{
		[XmlElement("target")]
		[JsonProperty("target")]
		public string Target;
		[XmlElement("module")]
		[JsonProperty("module")]
		public string Module;
		[XmlElement("args")]
		[JsonProperty("args")]
		public List<ModuleArgument> Arguments;

		public string Format()
		{
			string formatted = string.Format(@"new Object({{ target: '{0}', module: '{1}', args: {2}}})", this.Target, this.Module, this.Arguments.FormatParams());
			return formatted;
		}
	}
}
