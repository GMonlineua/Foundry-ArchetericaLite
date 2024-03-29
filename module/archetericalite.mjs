// Import document classes.
import { ArchetericaLiteActor } from "./documents/actor.mjs";
import { ArchetericaLiteItem } from "./documents/item.mjs";
// Import sheet classes.
import { ArchetericaLiteActorSheet } from "./sheets/actor-sheet.mjs";
import { ArchetericaLiteItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { preprocessChatMessage, renderChatMessage } from "./helpers/chat-portraits.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.archetericalite = {
    ArchetericaLiteActor,
    ArchetericaLiteItem,
    rollItemMacro
  };

  // Define custom Document classes and other configurations
  CONFIG.Actor.documentClass = ArchetericaLiteActor;
  CONFIG.Item.documentClass = ArchetericaLiteItem;
  CONFIG.Actor.compendiumBanner = "systems/archetericalite/ui/actor-banner.jpg";
  CONFIG.Adventure.compendiumBanner = "systems/archetericalite/ui/adventure-banner.jpg";
  CONFIG.Card.compendiumBanner = "systems/archetericalite/ui/card-banner.jpg";
  CONFIG.JournalEntry.compendiumBanner = "systems/archetericalite/ui/journalentry-banner.jpg";
  CONFIG.Item.compendiumBanner = "systems/archetericalite/ui/item-banner.jpg";
  CONFIG.Macro.compendiumBanner = "systems/archetericalite/ui/macro-banner.jpg";
  CONFIG.Playlist.compendiumBanner = "systems/archetericalite/ui/playlist-banner.jpg";
  CONFIG.RollTable.compendiumBanner = "systems/archetericalite/ui/rolltable-banner.jpg";
  CONFIG.Scene.compendiumBanner = "systems/archetericalite/ui/scene-banner.jpg";

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("archetericalite", ArchetericaLiteActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("archetericalite", ArchetericaLiteItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Chat Message                   */
/* -------------------------------------------- */

// Preprocess chat message before it is created hook
Hooks.on("preCreateChatMessage", preprocessChatMessage);

// Render chat message hook
Hooks.on("renderChatMessage", renderChatMessage);

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.archetericalite.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "archetericalite.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}
