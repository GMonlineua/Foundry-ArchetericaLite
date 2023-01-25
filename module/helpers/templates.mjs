/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/archetericalite/templates/actor/parts/actor-narrative.html",
    "systems/archetericalite/templates/actor/parts/actor-combat.html",
    "systems/archetericalite/templates/actor/parts/actor-mystical.html",
    "systems/archetericalite/templates/actor/parts/actor-riches.html",
    "systems/archetericalite/templates/actor/parts/actor-description.html",
    "systems/archetericalite/templates/actor/parts/npc-general.html",
    "systems/archetericalite/templates/actor/parts/npc-combat.html"
  ]);
};
