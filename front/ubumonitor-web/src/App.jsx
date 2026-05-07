import Principal from "./paginas/Principal";
import Listado_cursos from "./paginas/Listado_cursos";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PRINCIPAL */}
        <Route path="/" element={<Principal />} />

        {/* CURSOS */}
        <Route path="/cursos" element={<Listado_cursos />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;