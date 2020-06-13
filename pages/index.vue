<template>
  <article class="markdown p-4">
    <h2>Oración Inicial</h2>
    <p>
      <strong>Guía:</strong> Por la Señal de la Santa Cruz, de nuestros
      enemigos, libranos Señor, Dios nuestro. En el nombre del Padre, del Hijo y
      del Espíritu Santo.
      <br />
      <strong>Todos:</strong> Amén.
    </p>

    <p>
      <strong>Todos:</strong> Señor mío Jesucristo, Dios y Hombre verdadero,
      creador y redentor mío, por por ser tú quien eres y porque te amo sobre
      todas las cosas, me pesa de todo corazón haberte ofendido; propongo
      firmemente enmendarme, confesarme y cumplir la penitencia que me fuere
      impuesta, ofrezco cuanto hiciere en satisfacción de mis pecados.
      <br />
      Confío en tu bondad y misericordia infinita que me perdonarás por tu
      preciosa sangre, y me darás la gracia para nunca más pecar.
      <br />
      Amén.
    </p>

    <h2>Lectura de los Misterios</h2>
    <label class="min-w-0">
      <select
        v-model="misterios"
        class="w-full form-select truncate bg-gray-100 dark:bg-gray-900"
      >
        <option disabled value="">Selecciona los Misterios por Leer</option>
        <option value="gozosos">
          Misterios Gozosos (Lunes y Sábado)
        </option>
        <option value="luminosos">
          Misterios Luminosos (Jueves)
        </option>
        <option value="dolorosos">
          Misterios Dolorosos (Martes y Viernes)
        </option>
        <option value="gloriosos">
          Misterios Gloriosos (Miércoles y Domingo)
        </option>
      </select>
    </label>
    <component :is="misterios" />

    <h2>Oración por las intenciones del Santo Padre</h2>
    <p>
      <strong>Guía:</strong> Padre nuestro, que estas en cielo, santificado sea
      tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como
      en el cielo...
      <br />
      <strong>Todos:</strong> Danos hoy nuestro pan de cada día, perdona
      nuestras ofensas, como también nosotros perdonamos a los que nos ofenden,
      no nos dejes caer en la tentación y líbranos del mal.
    </p>
    <p>
      <strong>Guía:</strong> Alegrate María, llena eres de gracia, el Señor está
      contigo, bendita eres entre las mujeres y bendito es el fruto de tu
      vientre, Jesús...
      <br />
      <strong>Todos:</strong> Santa María Madre de Dios, ruega por nosotros los
      pecadores, ahora y en la hora de nuestra muerte. Amén.
    </p>
    <p>
      <strong>Guía:</strong> Gloria al Padre, al Hijo y al Espíritu Santo...
      <br />
      <strong>Todos:</strong> Como era en el principio, ahora y siempre, por los
      siglos de los siglos. Amén.
    </p>

    <h2>Jaculatorias</h2>
    <jaculatorias />

    <h2>Letanías</h2>
    <p>
      Guía: Lee la Letanía
      <br />
      <strong>Todos: Leen la Respuesta</strong>
    </p>
    <letanias />

    <h2>Oración Final</h2>
    <p>
      <strong>Guía:</strong> Cordero de Dios que quitas el pecado del mundo.
      <br />
      <strong>Todos:</strong> Perdónanos Señor.
    </p>
    <p>
      <strong>Guía:</strong> Cordero de Dios que quitas el pecado del mundo.
      <br />
      <strong>Todos:</strong> Óyenos Señor.
    </p>
    <p>
      <strong>Guía:</strong> Cordero de Dios que quitas el pecado del mundo.
      <br />
      <strong>Todos:</strong> Ten piedad y misericordia de nosotros.
    </p>
    <p>
      <strong>Guía:</strong> Bajo tu amparo nos acogemos, Santa Madre de Dios,
      no desperdicies las súplicas que te dirigimos en nuestras necesidades,
      antes bien, líbranos de todos los peligros, oh Virgen gloriosa y bendita.
      Ruega por nosotros, Santa Madre de Dios.
      <br />
      <strong>Todos:</strong> Para que seamos dignos de alcanzar las promesas de
      Nuestro Señor Jesucristo. Amén.
    </p>
    <p>
      <strong>Guía:</strong> Oh Dios, cuyo Unigénito Hijo, con su muerte, vida,
      muerte y resurrección, nos alcanzó el premio de la vida eterna:
      concédenos, a los que recordamos estos misterios del Santo Rosario, imitar
      lo que contienen y alcanzar lo que prometen. Por el mismo Jesucristo,
      nuestro Señor.
      <br />
      <strong>Todos:</strong> Amén.
    </p>
  </article>
</template>

<script>
  import Dolorosos from '../components/Misterios/Dolorosos'
  import Gloriosos from '../components/Misterios/Gloriosos'
  import Gozosos from '../components/Misterios/Gozosos'
  import Luminosos from '../components/Misterios/Luminosos'

  import Jaculatorias from '../components/Jaculatorias'
  import Letanias from '../components/Letanias'

  export default {
    components: {
      Dolorosos,
      Gloriosos,
      Gozosos,
      Luminosos,

      Jaculatorias,
      Letanias
    },

    data() {
      return {
        misterios: ''
      }
    },

    created() {
      const misterioDistribution = [
        'Gloriosos', // Sunday
        'Gozosos', // Monday
        'Dolorosos', // Tuesday
        'Gloriosos', // Wednesday
        'Luminosos', // Thursday
        'Dolorosos', // Friday
        'Gozosos' // Saturday
      ]
      const now = new Date()

      this.misterios = misterioDistribution[now.getDay()].toLowerCase()
    }
  }
</script>
