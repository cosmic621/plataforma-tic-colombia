import axios from 'axios'

const api = axios.create({
    baseURL:'http://localhost:8000/api',
    timeout: 10000,
})

export const getDepartamentos = () => api.get ('/departamentos')
export const getResumen = () => api.get ('/indicadores/resumen')
export const getDepartamento = () => api.get ('/departamentos/${id}')


