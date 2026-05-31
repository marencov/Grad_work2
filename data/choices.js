export const CHOICES = [
  {
    id: "poopCurry",
    label: "うんこ味のカレー",
    shortLabel: "うんこ味\nの\nカレー",
    color: "var(--red)",
  },
  {
    id: "curryPoop",
    label: "カレー味のうんこ",
    shortLabel: "カレー味\nの\nうんこ",
    color: "var(--blue)",
  },
];

export const choiceLabelById = CHOICES.reduce((labels, choice) => {
  labels[choice.id] = choice.label;
  return labels;
}, {});

export function getChoiceLabel(choiceId) {
  return choiceLabelById[choiceId] || choiceId || "未選択";
}
