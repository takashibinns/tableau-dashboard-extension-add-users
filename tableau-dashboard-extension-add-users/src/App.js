import { Routes, Route, HashRouter as Router } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DashboardExtension } from './components/DashboardExtension';
import { Config } from './components/Config';

//  Define default values, which will be passed to each component
const defaults = {
  settingsKey: "settings",
  apiVersion: "3.15"
}

function App() {
  return (
    <div>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar newestOnTop theme="colored"
          closeOnClick rtl={false} pauseOnFocusLoss draggable={false} pauseOnHover
      />
      <Router >
        <Routes>
          <Route path="/" element={<DashboardExtension settingsKey={defaults.settingsKey} />} />
          <Route path="/config" element={<Config settingsKey={defaults.settingsKey} defaultApiVersion={defaults.apiVersion}/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
