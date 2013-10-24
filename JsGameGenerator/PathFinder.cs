using System;
using System.IO;
using System.Reflection;

namespace GameMaker
{
	/// <summary>
	/// Takes care of finding various paths inside this assembly. Also produces the Extension script on which our game generation depends upon.
	/// </summary>
	public static class PathFinder
	{
		/// <summary>
		/// The root folder for the embedded resources in the library.
		/// </summary>
		internal static readonly string Root = "GameMaker.JsCode";

		/// <summary>
		/// The name of the game template file, the backbone of the algorithm.
		/// </summary>
		internal static readonly string GameTemplateFile = "GameTemplate.js";

		private static Lazy<Assembly> currentAssembly = new Lazy<Assembly>(Assembly.GetExecutingAssembly);

		/// <summary>
		/// Appends the specified filename to the root folder location. Use the returned value to locate embedded resources.
		/// </summary>
		internal static string AppendToRoot(string fileName)
		{
			return string.Format("{0}.{1}", Root, fileName);
		}

		/// <summary>
		/// Finds, reads to end and returns the content of the file whose name is filename.
		/// </summary>
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
