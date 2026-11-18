import { cardClass } from "../style/classes.js";

const StatCard = ({ label, value, icon: Icon, tone = "bg-[#DAF1DE] text-[#235347]" }) => (
  <div className={`${cardClass} flex items-center gap-4 p-5`}>
    {Icon && (
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    )}
    <div>
      <p className="text-2xl font-semibold tracking-tight text-[#051F20]">{value}</p>
      <p className="text-sm text-[#60766b]">{label}</p>
    </div>
  </div>
);

export default StatCard;
