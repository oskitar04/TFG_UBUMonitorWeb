import Principal from "./paginas/Principal";
import Listado_cursos from "./paginas/Listado_cursos";
import Curso from "./paginas/Curso";
import Participantes from "./paginas/Participantes";
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

        {/* PARTICIPANTES */}
        <Route path="/cursos/:id/participantes" element={<Participantes />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;