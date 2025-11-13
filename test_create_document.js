// Script de teste para verificar se os cookies são setados corretamente
// Execute no console do navegador em https://dev-test.criaai.com/documentInput

const API_URL = 'https://api-whitelabel-dev.criaai.com';
const API_KEY = 'EQUFUr6ipU2lX2WcpMBoc3Lk7mdDYNMH2rcq1jgE';
const TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU0NTEzMjA5OWFkNmJmNjEzODJiNmI0Y2RlOWEyZGZlZDhjYjMwZjAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY3JpYWFpLTI1Y2RlIiwiYXVkIjoiY3JpYWFpLTI1Y2RlIiwiYXV0aF90aW1lIjoxNzYyMjcyNDkwLCJ1c2VyX2lkIjoid1VKSnQxbm1yZk0zSldjZkpGSTVUaVpQQ2V3MSIsInN1YiI6IndVSkp0MW5tcmZNM0pXY2ZKRkk1VGlaUENldzEiLCJpYXQiOjE3NjIyNzI0OTAsImV4cCI6MTc2MjI3NjA5MCwiZW1haWwiOiJmbnNkZWl2aWR5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImZuc2RlaXZpZHlAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.AK3lBYEp_I2XesTgnbclNeTCcgmKD-omi0cnLfjQK8Av_PR2soTAEUxodyLf6t5QUr3kI5_cYdaQhfNkBif23z5rhZcYgairbRVJ0EpDjm2EhFaPHfpbqhLuVgWYsWaaGbkpaIyx-EFANxsYz0oWWICGBCqKurg3GuSGoQ473vQiDMQabfv3pcZiAfqCtBkkyVJIFjz0t_NrImPrhUO-M8qu47CfhG4NgERJebbDsh_f2TwVfUMZ74N9atUDuNB8Qoh0t8vCKRV1-QIgswvYgGX9u0tipCfgZG5yMGe1utC1nVGONSHA697N0AAzsC55WnPl45LJPFufrKfG-19Iow';

async function testCreateDocument() {
  console.log('🚀 Iniciando teste de createDocument...');
  console.log('📍 URL:', `${API_URL}/documents/create-document`);

  // Verificar cookies antes
  console.log('\n📋 Cookies ANTES da requisição:');
  console.log('document.cookie:', document.cookie || '(nenhum cookie)');

  try {
    const response = await fetch(`${API_URL}/documents/create-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'Authorization': `Bearer ${TOKEN}`,
        'origin': window.location.origin
      },
      credentials: 'include', // ← CRUCIAL: Permite receber cookies
      body: JSON.stringify({
        linkCallback: 'https://yoursite.com/callback'
      })
    });

    console.log('\n✅ Status da resposta:', response.status);
    console.log('📦 Headers da resposta:');
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('cookie') || key.toLowerCase().includes('set-cookie')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const data = await response.json();
    console.log('\n📄 Response body:', data);

    // Verificar cookies depois
    console.log('\n📋 Cookies DEPOIS da requisição:');
    console.log('document.cookie:', document.cookie || '(nenhum cookie)');

    // Verificar cookies específicos
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const authToken = getCookie('authToken');
    const authRefreshToken = getCookie('authRefreshToken');
    const documentId = getCookie('documentId');

    console.log('\n🍪 Cookies específicos:');
    console.log('  authToken:', authToken ? `${authToken.substring(0, 50)}...` : '❌ NÃO SETADO');
    console.log('  authRefreshToken:', authRefreshToken ? `${authRefreshToken.substring(0, 50)}...` : '❌ NÃO SETADO');
    console.log('  documentId:', documentId || '❌ NÃO SETADO');

    if (authToken && authRefreshToken && documentId) {
      console.log('\n✅ SUCESSO! Todos os cookies foram setados!');
    } else {
      console.log('\n❌ ERRO! Alguns cookies não foram setados.');
      console.log('\n💡 Dicas:');
      console.log('  1. Verifique no DevTools > Application > Cookies se os cookies estão lá');
      console.log('  2. Verifique se o Domain do cookie está correto (.criaai.com)');
      console.log('  3. Verifique se está usando HTTPS');
      console.log('  4. Verifique os logs do CloudWatch para ver o que foi retornado');
    }

  } catch (error) {
    console.error('\n❌ ERRO na requisição:', error);
  }
}

// Executar o teste
testCreateDocument();

