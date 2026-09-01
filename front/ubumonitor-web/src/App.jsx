import Principal from "./paginas/Principal";
import Listado_cursos from "./paginas/Listado_cursos";
import Curso from "./paginas/Curso";
import Logs from "./paginas/Logs";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PRINCIPAL */}
        <Route path="/" element={<Principal />} />

        {/* CURSOS */}
        <Route path="/cursos" element={<Listado_cursos />} />

        {/* CURSO */}
        <Route path="/cursos/:id" element={<Curso />} />

        {/* LOGS */}
        <Route path="/logs" element={<Logs />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;