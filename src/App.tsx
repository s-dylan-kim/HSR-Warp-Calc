import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Checkbox from '@mui/material/Checkbox';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, ResponsiveContainer } from 'recharts';
import './App.css';


const CHARACTER_PITY = 90;
const LIGHT_CONE_PITY = 80;
const CHARACTER_SOFT_PITY_THRESHOLD = 74; // how many pulls before hard pity does soft pity start
const LIGHT_CONE_SOFT_PITY_THRESHOLD = 66;
const CHARACTER_SOFT_PITY_SCALING = 0.06; // how much chance increases per pull in soft pity
const LIGHT_CONE_SOFT_PITY_SCALING = 0.07;
const CHARACTER_BASE_RATE = 0.006;
const LIGHT_CONE_BASE_RATE = 0.008;
const CHARACTER_RATE_UP_CHANCE = 0.5625;
const LIGHT_CONE_RATE_UP_CHANCE = 0.78125;



function App() {
  const [characterSelected, setCharacterSelected] = useState(true);
  const [count, setCount] = useState("");
  const [pity, setPity] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [data, setData] = useState([{roll: 0, percent: 0, cumulativeProb: 0}]);
  const [guarentee, setGuarentee] = useState(false);

  return (
    <div>
      <div id="selector">
        <FormControl>
          <FormLabel id="character-lightCone-buttons-group-label">What Are You Rolling For?</FormLabel>
          <RadioGroup
            row
            aria-labelledby="character-lightCone-buttons-group-label"
            defaultValue={true}
            name="character-lightCone-buttons-group"
            value={characterSelected}
            onChange={(event) => {setCharacterSelected(event.target.value === "true"); setPity(""); setCount("")}}
          >
            <FormControlLabel value={true} control={<Radio />} label="Character" />
            <FormControlLabel value={false} control={<Radio />} label="Light Cone" />
          </RadioGroup>
        </FormControl>


        <TextField
          id="count-field"
          label={characterSelected ? "Rate Up Characters (1 - 7)" : "Rate Up Light Cones (1 - 5)"}
          value = {count}
          variant="standard"
          margin="dense"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.value === "" ||
              (event.target.value.length === 1 && event.target.value >= "1" && ((characterSelected && event.target.value <= "7") || event.target.value <= "5"))
            ) {
              setCount(event.target.value);
            }
          }}
        />
        <TextField
          id="lc-field"
          label="Pity"
          value = {pity}
          variant="standard"
          margin="dense"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setPity(event.target.value);
          }}
        />

        <FormControlLabel control={
          <Checkbox 
            defaultChecked
            checked={guarentee}
            onChange={() => setGuarentee(!guarentee)}
          />}
          label="Guarentee"
        />

        <Button
          id="calc-button"
          variant="contained"
          onClick={() => calcDists(characterSelected, Number(count), Number(pity), guarentee)}
        >
          Calculate
        </Button>

        { showResults &&
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              id="roll-graph"
              width={1000}
              height={400}
              data={data}
              margin={{
                top: 10,
                right: 90,
                left: 30,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="roll">
                <Label value="Rolls" offset={-3} position="bottom" />
              </XAxis>
              <YAxis yAxisId="left" >
                {/* <Label value="Chance" offset={-20} position="insideLeft" /> */}
              </YAxis>
              <YAxis yAxisId="right" orientation="right" width={1} >
                {/* <Label value="Cumulative Chance" offset={-120} position="insideRight" /> */}
              </YAxis>
              <Tooltip/>
              <Legend verticalAlign="top" align="center" layout="horizontal" wrapperStyle={{top: 0, left: 62}} />
              <Line yAxisId="right" type="monotone" dataKey="cumulativeProb" stroke="#ff7300" dot={false} />
              <Area yAxisId="left" type="monotone" dataKey="percent" stroke="#8884d8" fill="#8884d8" />
            </ComposedChart>
          </ResponsiveContainer>
        }
      </div>
    </div>
  );

  function calcDists(isCharacter: boolean, needed:number, pity: number, guarentee: boolean) {
    setData([]);

    let guarenteedOdds = getDist(isCharacter, 0);
    let nonGuarenteedOdds = addDists(guarenteedOdds, guarenteedOdds, false, isCharacter);
  
    let baseDist = getDist(isCharacter, pity);

    if (!guarentee) {
      baseDist = addDists(baseDist, guarenteedOdds, false, isCharacter);
    }

    for (let obtained = 1; obtained < needed; obtained++) {
      baseDist = addDists(baseDist, nonGuarenteedOdds, true, isCharacter);
    }
  
    let cumulativeProbVals: number[] = [];
    let cumulativeProbVal: number = 0;

    for (let i = 0; i < baseDist.length; i++) {
      cumulativeProbVal = (baseDist[i] * 100) + cumulativeProbVal;
      cumulativeProbVals[i] = cumulativeProbVal;
      setData((old) => [...old, {roll: i, percent: baseDist[i] * 100, cumulativeProb: cumulativeProbVals[i]}]);
    }

    setShowResults(true);
  }
  
  function addDists(firstRolls: number[], secondRolls: number[], guarenteeFail: boolean, isCharacter: boolean) {
    let rateUpChance = guarenteeFail ? 0 : (isCharacter ? CHARACTER_RATE_UP_CHANCE : LIGHT_CONE_RATE_UP_CHANCE);
  
    let result: number[] = [];
  
    for (let i1 = 0; i1 < firstRolls.length; i1++) {
      if (result.length <= i1) {
        result.push(0);
      }
      result[i1] += firstRolls[i1] * rateUpChance;
  
      let lostPityChance = (1 - rateUpChance) * firstRolls[i1];
      for (let i2 = 0; i2 < secondRolls.length; i2++) {
        if (result.length <= i1 + i2) {
          result.push(0);
        }
        result[i1 + i2] += lostPityChance * secondRolls[i2];
      }
    }
  
    return result;
  }
  
  function getDist(isCharacter: boolean, pity: number) {
    let cur: number[] = [];
    
    let hardPity = isCharacter ? CHARACTER_PITY : LIGHT_CONE_PITY;
    let baseRate = isCharacter ? CHARACTER_BASE_RATE : LIGHT_CONE_BASE_RATE;
    let softPityThreshold = isCharacter ? CHARACTER_SOFT_PITY_THRESHOLD : LIGHT_CONE_SOFT_PITY_THRESHOLD;
    let softPityScaling = isCharacter ? CHARACTER_SOFT_PITY_SCALING : LIGHT_CONE_SOFT_PITY_SCALING;
  
    let prevProb = 1;
  
    cur.push(0);
    for (let pullCnt = pity + 1; pullCnt <= hardPity; pullCnt++) {
      if (pullCnt === hardPity) {
        cur.push(prevProb);
      } else if (pullCnt < softPityThreshold) {
        cur.push(prevProb * baseRate);
        prevProb = prevProb * (1 - baseRate);
      } else {
        cur.push(prevProb * (baseRate + (pullCnt - softPityThreshold + 1) * softPityScaling));
        prevProb = prevProb * (1 - (baseRate + (pullCnt - softPityThreshold + 1) * softPityScaling));
      }
    }
  
    return cur;
  }
}

export default App;