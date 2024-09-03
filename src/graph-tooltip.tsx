import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { TooltipProps } from 'recharts';
import './graph-tooltip.css';

export default function CustomTooltip({
    active,
    payload,
    label,
}: TooltipProps<ValueType, NameType>) {
    if (active && payload && payload.length) {
        console.log(payload)
        const percent = typeof payload[1].value == 'number' ? payload[1].value : 0;
        const cumulativePercent = typeof payload[0].value == 'number' ? payload[0].value : 0;
        return (
            <div className="custom-tooltip">
                <p className="label">{`Roll: ${label}`}</p>
                <p className="desc">
                {`
                Probability: ${Math.round(percent * 100)/100}% \n
                `}
                </p>
                <p className="desc">
                {`Cumulative Probability: ${Math.round(cumulativePercent * 100)/100}%`}
                </p>
            </div>
        );
    }
    return null;
};