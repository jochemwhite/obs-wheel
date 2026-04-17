type StreamControlState = {
  active: boolean;
  updatedAt: string;
};

let active = false;
let updatedAt = new Date(0).toISOString();

function snapshot(): StreamControlState {
  return { active, updatedAt };
}

export function getControlStreamState(): StreamControlState {
  return snapshot();
}

export function setControlStreamState(nextActive: boolean): StreamControlState {
  active = nextActive;
  updatedAt = new Date().toISOString();
  return snapshot();
}

