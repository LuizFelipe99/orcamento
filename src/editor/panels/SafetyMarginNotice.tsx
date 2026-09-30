type SafetyMarginNoticeProps = {
  safetyMarginPercent: number | null;
};

export const SafetyMarginNotice = ({ safetyMarginPercent }: SafetyMarginNoticeProps) => {
  if (safetyMarginPercent !== null && safetyMarginPercent > 0) {
    return null;
  }

  return (
    <p className="planes-panel__warning">
      Sem margem de segurança: quantidade exata. Informe a margem da madeira no painel Projeto.
    </p>
  );
};
