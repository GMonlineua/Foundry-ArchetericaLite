export async function prepareRollDialog(sheet, type) {
  const speaker = ChatMessage.getSpeaker({ actor: sheet.actor });

  if (type === "narrative") {
    const testName = game.i18n.localize("ARCHETERICALITE.NarrativeTest");
    const template_data = { narrative: true, modifier: true };
    const rendered_html = await renderHtml(template_data);
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => narrativeTest(testName, speaker, html)
    };
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "embarrassment") {
    const testName = game.i18n.localize("ARCHETERICALITE.EmbarrassmentTest");
    const template_data = { modifier: true };
    const rendered_html = await renderHtml(template_data);
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => embarrassment(testName, speaker, sheet, html)
    };
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "brawl") {
    const testName = game.i18n.localize("ARCHETERICALITE.MasteryTest") + ": " + game.i18n.localize("ARCHETERICALITE.Brawl");
    const template_data = { mastery: true };
    const rendered_html = await renderHtml(template_data);
    let actorMastery = sheet.object.system.combat.brawl;
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => masteryTest(testName, speaker, actorMastery, html)
    };
    let option = type;
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "fencing") {
    const testName = game.i18n.localize("ARCHETERICALITE.MasteryTest") + ": " + game.i18n.localize("ARCHETERICALITE.Fencing");
    const template_data = { mastery: true };
    const rendered_html = await renderHtml(template_data);
    let actorMastery = sheet.object.system.combat.fencing;
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => masteryTest(testName, speaker, actorMastery, html)
    };
    let option = type;
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "firearms") {
    const testName = game.i18n.localize("ARCHETERICALITE.MasteryTest") + ": " + game.i18n.localize("ARCHETERICALITE.Firearms");
    const template_data = { mastery: true };
    const rendered_html = await renderHtml(template_data);
    let actorMastery = sheet.object.system.combat.firearms;
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => masteryTest(testName, speaker, actorMastery, html)
    };
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "throwing") {
    const testName = game.i18n.localize("ARCHETERICALITE.MasteryTest") + ": " + game.i18n.localize("ARCHETERICALITE.Throwing");
    const template_data = { mastery: true };
    const rendered_html = await renderHtml(template_data);
    let actorMastery = sheet.object.system.combat.throwing;
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => masteryTest(testName, speaker, actorMastery, html)
    };
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "damage") {
    const testName = game.i18n.localize("ARCHETERICALITE.Damage");
    const template_data = { damage: true };
    const rendered_html = await renderHtml(template_data);
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => damageTest(testName, speaker, html)
    };
    createDialog(testName, rendered_html, submit);
  }

  else if (type === "imago") {
    const testName = game.i18n.localize("ARCHETERICALITE.ImagoTest");
    const template_data = { imago: true, modifier: true };
    const rendered_html = await renderHtml(template_data);
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => imagoTest(testName, speaker, sheet, html)
    };
    createDialog(testName, rendered_html, submit);
  }

  else {
    const testName = game.i18n.localize("ARCHETERICALITE.StandartTest");
    const template_data = { customDifficulty: true, modifier: true };
    const rendered_html = await renderHtml(template_data);
    let submit = {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("ARCHETERICALITE.Roll"),
      callback: (html) => standartTest(testName, speaker, html)
    };
    createDialog(testName, rendered_html, submit);
  }
}

function renderHtml(template_data) {
  const template_file = "systems/archetericalite/templates/apps/rollTest.hbs";
  const rendered_html = renderTemplate(template_file, template_data);
  return rendered_html;
}

function createDialog(testName, rendered_html, submit) {
  let d = new Dialog(
    {
      title: testName,
      content: rendered_html,
      buttons: {
        roll: submit,
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("ARCHETERICALITE.RollCancel"),
          callback: () => {},
        },
      },
      default: "roll",
      close: () => {},
    },
    { width: "250" }
  );
  d.render(true);
}

function narrativeTest(testName, speaker, html) {
  let difficulty = html.find("#narrativeDifficulty")[0].value;
  let modifier = html.find("#modifier")[0].value;
  rollDice(testName, speaker, modifier, difficulty)
}

function embarrassment(testName, speaker, sheet, html) {
  let difficulty = sheet.object.system.stress;
  let modifier = html.find("#modifier")[0].value;
  rollDice(testName, speaker, modifier, difficulty)
}

function masteryTest(testName, speaker, actorMastery, html) {
  let modifier = html.find("#advantage")[0].value;
  let opponentMastery = parseInt(html.find("#opponentMastery")[0].value, 10);
  let difficulty = 7 - actorMastery + opponentMastery;

  rollDice(testName, speaker, modifier, difficulty)
}

function damageTest(testName, speaker, html) {
  let damage = html.find("#damage")[0].value;
  let lethality = html.find("#lethality")[0].value;

  let roll = new Roll("@damage+@lethality", {damage, lethality});
  roll.toMessage({
    speaker: speaker,
    flavor: testName,
    rollMode: "roll", create: true
  });
}

function imagoTest(testName, speaker, sheet, html) {
  let modifier = html.find("#modifier")[0].value;
  let opponentImago = parseInt(html.find("#imago")[0].value, 10);
  let actorImago = sheet.object.system.mystical.imago;
  let difficulty = 7 - actorImago + opponentImago;
  rollDice(testName, speaker, modifier, difficulty);

}

function standartTest(testName, speaker, html) {
  let difficulty = html.find("#customDifficulty")[0].value;
  let modifier = html.find("#modifier")[0].value;
  rollDice(testName, speaker, modifier, difficulty);
}

function rollDice(testName, speaker, modifier, difficulty) {
  let label = testName;
  if (difficulty != 0) {
    label += ", Складність: " + difficulty
  }
  let roll = new Roll("2d6+@modifier", {modifier});
  roll.toMessage({
    speaker: speaker,
    flavor: label,
    rollMode: "roll", create: true
  });
  return roll;
}
