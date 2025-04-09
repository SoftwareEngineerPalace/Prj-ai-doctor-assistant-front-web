import React, { createContext, useState, ReactNode } from "react";

interface RecordContextType {
  recordState: RecordState;
  setRecordState: React.Dispatch<React.SetStateAction<RecordState>>;
  patient: string;
  setPatient: React.Dispatch<React.SetStateAction<string>>;
  doctor: string;
  setDoctor: React.Dispatch<React.SetStateAction<string>>;
  chatList: any[];
  setChatList: React.Dispatch<React.SetStateAction<any[]>>;
  audioUrl: string;
  setAudioUrl: React.Dispatch<React.SetStateAction<string>>;
  isRecordingSaved: boolean;
  setIsRecordingSaved: React.Dispatch<React.SetStateAction<boolean>>;
  visitid: string;
  setVisitid: React.Dispatch<React.SetStateAction<string>>;
  visittype: number;
  setVisittype: React.Dispatch<React.SetStateAction<number>>;
  mvid: string;
  setMvid: React.Dispatch<React.SetStateAction<string>>;
  wsState: WsState;
  setWsState: React.Dispatch<React.SetStateAction<WsState>>;
  isRecordReady: boolean;
  setIsRecordReady: React.Dispatch<React.SetStateAction<boolean>>;
  audioListPageIndex: number;
  setAudioListPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

enum RecordState {
  DEFAULT = "DEFAULT",
  RECORDING = "RECORDING",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED",
}

enum WsState {
  default = "default",
  open = "open", // 0
  close = "close", // 1
  error = "error", // 2
}

const RecordStateProvider = ({ children }: { children: ReactNode }) => {
  const [recordState, setRecordState] = useState<RecordState>(
    RecordState.DEFAULT,
  );
  const [patient, setPatient] = useState<string>("");
  const [doctor, setDoctor] = useState<string>("");
  const [chatList, setChatList] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isRecordingSaved, setIsRecordingSaved] = useState(false);
  const [visitid, setVisitid] = useState<string>("");
  const [visittype, setVisittype] = useState<number>(1);
  const [mvid, setMvid] = useState<string>("");
  const [wsState, setWsState] = useState<WsState>(WsState.default);
  const [isRecordReady, setIsRecordReady] = useState(false);
  const [audioListPageIndex, setAudioListPageIndex] = useState<number>(1);

  return (
    <RecordContext.Provider
      value={{
        recordState,
        setRecordState,
        patient,
        setPatient,
        doctor,
        setDoctor,
        chatList,
        setChatList,
        audioUrl,
        setAudioUrl,
        isRecordingSaved,
        setIsRecordingSaved,
        visitid,
        setVisitid,
        visittype,
        setVisittype,
        mvid,
        setMvid,
        wsState,
        setWsState,
        isRecordReady,
        setIsRecordReady,
        audioListPageIndex,
        setAudioListPageIndex,
      }}
    >
      {children}
    </RecordContext.Provider>
  );
};

export { RecordContext, RecordStateProvider, RecordState, WsState };
