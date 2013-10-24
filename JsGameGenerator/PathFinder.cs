using System;
using System.IO;
using System.Reflection;

namespace GameMaker
{
	/// <summary>
	/// Takes care of finding various paths inside this assembly. Also produces the Extension script which is neccessary 
	/// </summary>
	public static class PathFinder
	{
		internal static string Root = "GameMaker.JsCode";
		internal static string GameTemplateFile = "GameTemplate.js";

		private static Lazy<Assembly> currentAssembly = new Lazy<Assembly>(Assembly.GetExecutingAssembly);

		internal static string AppendToRoot(string fileName)
		{
			return string.Format("{0}.{1}", Root, fileName);
		}

		internal static string ReadEmbeddedFile(string fileName)
		{
			Stream template = currentAssembly.Value.GetManifestResourceStream(PathFinder.AppendToRoot(fileName));
			StreamReader reader = new StreamReader(template);

			return reader.ReadToEnd();
		}

		/// <summary>
		/// Creates the Extension script at the specified path. This script must be included in the page BEFORE any game has been generated since it provides
		/// common functionality that games use.
		/// </summary>
		/// <param name="path">The path to write the script to.</param>
		public static void CreateExtensionsScipt(string path)
		{
			string script = ReadEmbeddedFile("Extensions.js");
			File.WriteAllText(path, script);
		}
	}
}
