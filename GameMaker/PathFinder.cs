using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace GameMaker.WebApp
{
	/// <summary>
	/// Container for all RELATIVE paths used accros the app. To get the absolute path, prepend the application root path (Application.RootPath); 
	/// </summary>
    public class PathFinder
    {
        public static readonly string
            EmptyModel = @"Xml\EmptyModel.xml",
            DefaultEvents = @"Xml\DefaultEvents.xml",
            DefaultUnitModules = @"Xml\UnitPresetModules.xml",
			DefaultGameModules = @"Xml\GamePresetModules.xml";

        public static readonly string
            ConfigFile = @"Scripts\config.js";

        public static readonly string
            Root = @"Data\",
            ImageLibrary = @"images\library",
            EmptyGame = @"game.html";

		public static readonly string
			GameScripts = @"Games\",
			GameArchives = @"Archives\",
			PublishedGames = @"PublishedGames\";

        public static string GetGameFilePath()
        {
            return string.Format("{0}{1}.js", Path.Combine(GameScripts, "game-"), Guid.NewGuid());
        }

        public static string GetGameArchiveNamePath()
        {
            return string.Format("{0}{1}.zip", Path.Combine(GameArchives, "Awesome-archive-containing-your-game-"), Guid.NewGuid());
        }

		public static string GetPublishedGamePath(string gameName)
		{
			return string.Format("{0}.xml", Path.Combine(PublishedGames, gameName));
		}
	}
}