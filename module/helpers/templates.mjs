/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor tabs.
    "systems/archetericalite/templates/actor/tabs/actor-narrative.hbs",
    "systems/archetericalite/templates/actor/tabs/actor-combat.hbs",
    "systems/archetericalite/templates/actor/tabs/actor-mystical.hbs",
    "systems/archetericalite/templates/actor/tabs/actor-riches.hbs",
    "systems/archetericalite/templates/actor/tabs/actor-description.hbs",
    "systems/archetericalite/templates/actor/tabs/npc-general.hbs",
    "systems/archetericalite/templates/actor/tabs/npc-combat.hbs",
    // Parts
    "systems/archetericalite/templates/actor/parts/biography-type.hbs",
    "systems/archetericalite/templates/actor/parts/narrative-attribute.hbs",
    "systems/archetericalite/templates/actor/parts/negative.hbs",
    "systems/archetericalite/templates/actor/parts/trauma.hbs",
    "systems/archetericalite/templates/actor/parts/combat-talent.hbs",
    "systems/archetericalite/templates/actor/parts/combat-rule.hbs",
    "systems/archetericalite/templates/actor/parts/mystical-ability.hbs",
    "systems/archetericalite/templates/actor/parts/metamorphosis.hbs",
    "systems/archetericalite/templates/actor/parts/weapon.hbs",
    "systems/archetericalite/templates/actor/parts/protection.hbs",
    "systems/archetericalite/templates/actor/parts/loot.hbs",
    "systems/archetericalite/templates/actor/parts/npc-talents.hbs",
    // Item parts
    "systems/archetericalite/templates/item/parts/equipment-header.hbs"
  ]);
};
